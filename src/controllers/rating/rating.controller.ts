import { Request, Response } from "express";
import mongoose from "mongoose";

import asyncHandler from "../../middlewares/asyncHandler";

import { ApiError } from "../../utils/apiResponseHandler/apiError";
import { ApiResponse } from "../../utils/apiResponseHandler/apiResponse";
import { HTTP_STATUS, RESPONSE_MESSAGES } from "../../utils/constant";

import Student from "../../model/student";
import Course from "../../model/course";
import RatingAndReview from "../../model/ratingAndReview";

export const addRatingAndReview = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { rating, review } = req.body;
    const { id } = req.currentUser;

    const student = await Student.findById(id);

    if (!student) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.USERS.NOT_FOUND,
      });
    }

    if (
      !courseId ||
      !rating ||
      !review ||
      isNaN(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      throw new ApiError({
        status: HTTP_STATUS.BAD_REQUEST,
        message: RESPONSE_MESSAGES.RATING_AND_REVIEWS.INVALID_FORMAT,
      });
    }

    const ratingAndReview = await RatingAndReview.create({
      user: id,
      rating,
      review,
      course: courseId,
    });
    //add ratingAndReview ID to course by ratingId
    const course = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          ratingAndReview: ratingAndReview._id,
        },
      },
      { new: true }
    );

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.RATING_AND_REVIEWS.ADDED,
        data: { ratingAndReview, course },
      })
    );
  }
);

export const getAverageRating = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;

    if (!courseId) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.COURSES.NOT_FOUND,
      });
    }

    const pipeline = [
      {
        //Why does we use "new" keyword here ??
        $match: { _id: new mongoose.Types.ObjectId(courseId) },
      },
      {
        $lookup: {
          from: "ratingandreviews",
          localField: "_id",
          foreignField: "course",
          as: "ratings",
        },
      },
      {
        $set: {
          averageRating: { $avg: "$ratings.rating" },
        },
      },
      {
        $unset: "ratings",
      },
    ];

    const result = await Course.aggregate(pipeline);

    if (result.length === 0) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message:
          RESPONSE_MESSAGES.RATING_AND_REVIEWS.COURSE_NOT_FOUND_OR_NO_RATINGS,
      });
    }

    const averageRating = result[0].averageRating;

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.RATING_AND_REVIEWS.AVERAGE_RATING,
        data: { averageRating },
      })
    );
  }
);

export const getAllRatingByCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;

    if (!courseId) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.COURSES.NOT_FOUND,
      });
    }

    const ratingAndReviews = await RatingAndReview.find({ course: courseId })
      .populate({ path: "user", select: "firstName lastName -_id" })
      .exec();

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.RATING_AND_REVIEWS.COURSE_RATINGS_FOUND,
        data: { ratingAndReviews },
      })
    );
  }
);
