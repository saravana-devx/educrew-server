import { Request, Response } from "express";

import asyncHandler from "../../middlewares/asyncHandler";

import { ApiError } from "../../utils/apiResponseHandler/apiError";
import { ApiResponse } from "../../utils/apiResponseHandler/apiResponse";
import { HTTP_STATUS, RESPONSE_MESSAGES } from "../../utils/constant";

import Course from "../../model/course";

export const getCourseByCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { category } = req.params;
    const courses = await Course.find({ category }).populate({
      path: "instructor",
      model: "User",
      select: "firstName lastName image",
    });
    const totalCourses = courses.length;

    if (courses.length === 0) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.COURSES.NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.COURSES.CATEGORY_FOUND,
        data: { courses, totalCourses },
      })
    );
  }
);

export const getSearchResults = asyncHandler(
  async (req: Request, res: Response) => {
    const { searchQuery } = req.params;

    if (!searchQuery || typeof searchQuery !== "string") {
      throw new ApiError({
        status: HTTP_STATUS.BAD_REQUEST,
        message: RESPONSE_MESSAGES.COURSES.INVALID_SEARCH_QUERY,
      });
    }

    const searchResults = await Course.find({
      status: "Published",
      $or: [
        { courseName: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
      ],
    }).populate({
      path: "instructor",
      model: "User",
      select: "firstName lastName image",
    });

    if (searchResults.length === 0) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.COURSES.NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.COURSES.SEARCH_RESULTS,
        data: { searchResults },
      })
    );
  }
);

export const getTopCourses = asyncHandler(
  async (req: Request, res: Response) => {
    const topCourses = await Course.find()
      .populate("instructor")
      .sort({ studentEnrolled: -1 })
      .limit(8);

    if (!topCourses) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.COURSES.NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.COURSES.FOUND,
        data: topCourses,
      })
    );
  }
);
