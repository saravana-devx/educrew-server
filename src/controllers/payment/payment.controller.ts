import { Request, Response } from "express";
import mongoose, { ObjectId } from "mongoose";

import asyncHandler from "../../middlewares/asyncHandler";

import { ApiError } from "../../utils/apiResponseHandler/apiError";
import { ApiResponse } from "../../utils/apiResponseHandler/apiResponse";
import { HTTP_STATUS, RESPONSE_MESSAGES } from "../../utils/constant";
import mailSender from "../../utils/email/mailSender";

import Student from "../../model/student";
import Course from "../../model/course";

import path from "path";
import fs from "fs";
import Stripe from "stripe";
import Instructor from "../../model/instructor";

export const createCheckOutSession = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.currentUser.id;
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!courseId) {
    throw new ApiError({
      status: HTTP_STATUS.BAD_REQUEST,
      message: RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
    });
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError({
      status: HTTP_STATUS.NOT_FOUND,
      message: RESPONSE_MESSAGES.COURSES.NOT_FOUND,
    });
  }

  const student = await Student.findById(userId);
  if (!student) {
    throw new ApiError({
      status: HTTP_STATUS.NOT_FOUND,
      message: RESPONSE_MESSAGES.USERS.NOT_FOUND,
    });
  }

  if (student.enrolledCourses.length < 0) {
    throw new ApiError({
      status: HTTP_STATUS.FORBIDDEN,
      message: RESPONSE_MESSAGES.ENROLLMENTS.ALREADY_ENROLLED,
    });
  }

  if (!secretKey) {
    throw new ApiError({
      status: HTTP_STATUS.FORBIDDEN,
      message: RESPONSE_MESSAGES.PAYMENT.KEY_NOT_FOUND,
    });
  }

  const stripe = new Stripe(secretKey);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `${process.env.Frontend_Production_url}/payment-success`,
    cancel_url: `${process.env.Frontend_Production_url}/payment-cancel`,
    metadata: {
      courseId: courseId,
      userId: userId,
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: course.courseName,
          },
          unit_amount: course.price * 100,
        },
        quantity: 1,
      },
    ],
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse({
      status: HTTP_STATUS.OK,
      message: "Checkout session created successfully",
      data: { id: session.id },
    })
  );
};

const purchaseCourseOperation = async (userId: string, courseId: string) => {
  const student = await Student.findById(userId);
  const course = await Course.findById(courseId);

  if (!student) {
    throw new ApiError({
      status: HTTP_STATUS.NOT_FOUND,
      message: RESPONSE_MESSAGES.USERS.NOT_FOUND,
    });
  }

  if (!course) {
    throw new ApiError({
      status: HTTP_STATUS.NOT_FOUND,
      message: RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
    });
  }

  await Student.findByIdAndUpdate(
    userId,
    {
      $push: { enrolledCourses: courseId },
    },
    { new: true }
  );

  // add student id in studentEnrolled array in course
  await Course.findByIdAndUpdate(
    courseId,
    {
      $push: {
        studentEnrolled: userId,
      },
    },
    { new: true }
  );
  await Instructor.findByIdAndUpdate(
    course.instructor,
    {
      $inc: {
        earnings: course.price,
      },
    },
    { new: true }
  );

  const templatePath = path.join(
    __dirname,
    "..",
    "..",
    "utils",
    "email",
    "templates",
    "purchasedCourse.html"
  );
  let emailHtml = fs.readFileSync(templatePath, "utf8");
  emailHtml = emailHtml.replace(/{{courseName}}/g, course.courseName);

  await mailSender(student.email, "Course Purchase Confirmation", emailHtml);
};

export const stripeWebhook = asyncHandler(
  async (req: Request, res: Response) => {

    const sig = req.headers["stripe-signature"];
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secretKey || !endpointSecret) {
      return res.status(403).send("Stripe secret keys missing");
    }

    const stripe = new Stripe(secretKey);
    let event;

    try {
      // Pass raw request body directly
      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        endpointSecret
      );
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const courseId = session.metadata?.courseId;
      const userId = session.metadata?.userId;

      if (!courseId || !userId) {
        return res.status(400).send("Missing metadata");
      }

      await purchaseCourseOperation(userId, courseId);
    }

    res.status(200).send("Webhook received");
  }
);
