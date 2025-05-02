import { Request, Response } from "express";
import { ObjectId } from "mongoose";

import asyncHandler from "../../middlewares/asyncHandler";

import { ApiError } from "../../utils/apiResponseHandler/apiError";
import { ApiResponse } from "../../utils/apiResponseHandler/apiResponse";
import { HTTP_STATUS, RESPONSE_MESSAGES } from "../../utils/constant";
import uploadMediaToCloudinary from "../../utils/cloudinary/uploadMediaToCloudinary";

import { IInstructor } from "../../interfaces/interface";

import User from "../../model/user";
import Course from "../../model/course";
import Section from "../../model/section";
import SubSection from "../../model/subSection";
import RatingAndReview from "../../model/ratingAndReview";
import Student from "../../model/student";
import Instructor from "../../model/instructor";

export const createCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseName, description, price, status, category } = req.body;

    let { whatYouWillLearn } = req.body;

    const { id } = req.currentUser;

    // Convert stringified array if it comes as a string
    if (typeof whatYouWillLearn === "string") {
      try {
        whatYouWillLearn = JSON.parse(whatYouWillLearn);
      } catch (err) {
        throw new ApiError({
          status: HTTP_STATUS.BAD_REQUEST,
          message: "Invalid format for whatYouWillLearn",
        });
      }
    }

    // Validate it's actually an array
    if (!Array.isArray(whatYouWillLearn) || whatYouWillLearn.length === 0) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
      });
    }

    const instructor = await Instructor.findById(id);
    if (!instructor) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.USERS.NOT_FOUND,
      });
    }

    if (
      !courseName ||
      !description ||
      !price ||
      !whatYouWillLearn ||
      !category
    ) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
      });
    }

    if (!req.file) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
      });
    }

    const response = await uploadMediaToCloudinary(req.file.path);
    const thumbnailUrl = response.secure_url;

    const course = await Course.create({
      courseName,
      instructor: id,
      description,
      thumbnail: thumbnailUrl,
      price,
      whatYouWillLearn,
      category,
      status,
      content: [],
    });

    instructor.courses.push(course._id as ObjectId);
    await instructor.save();

    res.status(HTTP_STATUS.CREATED).json(
      new ApiResponse({
        status: HTTP_STATUS.CREATED,
        message: RESPONSE_MESSAGES.COURSES.CREATED,
        data: { course },
      })
    );
  }
);

export const editCourse = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { courseName, description, price, status, category } = req.body;
  const whatYouWillLearn = JSON.parse(req.body.whatYouWillLearn);

  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError({
      status: HTTP_STATUS.NOT_FOUND,
      message: RESPONSE_MESSAGES.COURSES.NOT_FOUND,
    });
  }

  let thumbnailUrl;
  if (req.file) {
    const response = await uploadMediaToCloudinary(req.file.path);
    thumbnailUrl = response.secure_url;
  }

  const editedCourse = await Course.findByIdAndUpdate(
    courseId,
    {
      courseName,
      description,
      price,
      whatYouWillLearn,
      status,
      category,
      ...(thumbnailUrl && { thumbnail: thumbnailUrl }), //add new thumbnail url if thumbnail changed
    },
    { new: true }
  );

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse({
      status: HTTP_STATUS.OK,
      message: RESPONSE_MESSAGES.COURSES.UPDATED,
      data: { editedCourse },
    })
  );
});

export const getCourseById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate({
        path: "instructor",
        model: "User",
        select: "firstName lastName image",
      })
      .populate({
        path: "content",
        model: "Section",
        populate: { path: "subSection", model: "SubSection" },
      })
      .populate({
        path: "ratingAndReview",
        populate: {
          path: "user",
          model: "User",
          select: "firstName lastName image",
        },
      });

    if (!course) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.COURSES.NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.COURSES.FOUND,
        data: { course },
      })
    );
  }
);

export const getAllCourses = asyncHandler(
  async (req: Request, res: Response) => {
    const courses = await Course.find({ status: "Published" }).populate({
      path: "instructor",
      model: "User",
      select: "firstName lastName image",
    });

    if (!courses) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.COURSES.NOT_FOUND,
      });
    }
    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.COURSES.FOUND,
        data: { courses },
      })
    );
  }
);

export const getPagination = asyncHandler(
  async (req: Request, res: Response) => {
    const page: number = Number(req.query.page) || 1;
    const limit: number = Number(req.query.limit) || 6;

    if (isNaN(page) || isNaN(limit)) {
      throw new ApiError({
        status: HTTP_STATUS.CONFLICT,
        message: "Invalid page or limit value",
      });
    }

    //To eliminate previous page courses
    const startIndex = (page - 1) * limit;

    const courses = await Course.find()
      .populate({
        path: "instructor",
        model: "User",
        select: "firstName lastName image",
      })
      .limit(limit)
      .skip(startIndex)
      .exec();
    const totalCourses = await Course.countDocuments().exec();

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: `Displaying page ${page} with a limit of ${limit} courses per page.`,
        data: {
          courses,
          totalCourses,
        },
      })
    );
  }
);

export const getCourseByUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.currentUser;
    const user = await Student.findById(id).populate({
      path: "enrolledCourses",
      model: "Course",
      select: "courseName instructor thumbnail description",
      populate: {
        path: "instructor",
        model: "User",
        select: "firstName lastName image",
      },
    });

    if (!user) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.COURSES.USER_COURSES_NOT_FOUND,
      });
    }
    const courses = user.enrolledCourses;

    //if enrolledCourses is empty respond with not found message
    if (courses.length === 0) {
      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse({
          status: HTTP_STATUS.OK,
          message: RESPONSE_MESSAGES.COURSES.USER_NOT_ENROLLED,
        })
      );
    }

    // Respond with the found courses
    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.COURSES.USER_COURSES_FOUND,
        data: { courses },
      })
    );
  }
);

export const updateCourseStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.courseId;
    const newStatus = req.body.status;

    const course = await Course.findByIdAndUpdate(
      id,
      { $set: { status: newStatus } },
      { new: true }
    );

    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        new ApiResponse({
          status: HTTP_STATUS.NOT_FOUND,
          message: RESPONSE_MESSAGES.COURSES.NOT_FOUND,
        })
      );
    }

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.COURSES.COURSE_STATUS_UPDATED,
        data: course,
      })
    );
  }
);

export const deleteCourseByInstructor = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;

    const course = await Course.findByIdAndDelete(courseId);
    if (!course) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.COURSES.NOT_FOUND,
      });
    }

    await Section.deleteMany({ courseId });
    await SubSection.deleteMany({ courseId });
    await RatingAndReview.deleteMany({ courseId });

    await User.updateMany(
      { courses: courseId },
      { $pull: { courses: courseId } }
    );

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.COURSES.DELETED,
      })
    );
  }
);

export const deleteCourseByAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;

    const course = await Course.findByIdAndDelete(courseId);
    if (!course) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.COURSES.NOT_FOUND,
      });
    }

    await Section.deleteMany({ courseId });
    await SubSection.deleteMany({ courseId });
    await RatingAndReview.deleteMany({ courseId });

    await User.updateMany(
      { courses: courseId },
      { $pull: { courses: courseId } }
    );

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.COURSES.DELETED,
      })
    );
  }
);
