import { Request, Response } from "express";

import asyncHandler from "../../../middlewares/asyncHandler";

import { ApiError } from "../../../utils/apiResponseHandler/apiError";
import { ApiResponse } from "../../../utils/apiResponseHandler/apiResponse";
import { HTTP_STATUS, RESPONSE_MESSAGES } from "../../../utils/constant";

import Course from "../../../model/course";
import Section from "../../../model/section";
import SubSection from "../../../model/subSection";

export const addSection = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { sectionName } = req.body;

    if (!courseId || !sectionName) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
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

    const section = await Section.create({ sectionName });

    //add section Id in course content array
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          content: section._id,
        },
      },
      { new: true }
    );

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.SECTIONS.CREATED,
        data: { section, updatedCourse },
      })
    );
  }
);

export const updateSection = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId, sectionId } = req.params;
    const { sectionName } = req.body;

    if (!courseId) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
      });
    }

    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName },
      { new: true }
    );

    if (!updatedSection) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.SECTIONS.NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.SECTIONS.UPDATED,
        data: { updatedSection },
      })
    );
  }
);

export const deleteSection = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId, sectionId } = req.params;

    if (!courseId || !sectionId) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
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

    const section = await Section.findById(sectionId);
    if (!section) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.SECTIONS.FOUND,
      });
    }

    await SubSection.deleteMany({ _id: { $in: section.subSection } });
    await Section.findByIdAndDelete(sectionId);

    await Course.findByIdAndUpdate(courseId, {
      $pull: { content: sectionId },
    });

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.SECTIONS.DELETED,
        data: { section },
      })
    );
  }
);
