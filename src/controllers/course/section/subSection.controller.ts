import { Request, Response } from "express";
import asyncHandler from "../../../middlewares/asyncHandler";
import { ApiError } from "../../../utils/apiResponseHandler/apiError";
import { HTTP_STATUS, RESPONSE_MESSAGES } from "../../../utils/constant";
import Section from "../../../model/section";
import uploadMediaToCloudinary from "../../../utils/cloudinary/uploadMediaToCloudinary";
import SubSection from "../../../model/subSection";
import { ApiResponse } from "../../../utils/apiResponseHandler/apiResponse";

export const addSubSection = asyncHandler(
  async (req: Request, res: Response) => {
    const { sectionId } = req.params;
    const { title, description } = req.body;

    if (!title || !description) {
      throw new ApiError({
        status: HTTP_STATUS.BAD_REQUEST,
        message: RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
      });
    }
    
    if (!req.file) {
      throw new ApiError({
        status: HTTP_STATUS.BAD_REQUEST,
        message: RESPONSE_MESSAGES.COMMON.VIDEO_NOT_FOUND,
      });
    }

    const section = await Section.findById(sectionId);
    if (!section) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.SECTIONS.NOT_FOUND,
      });
    }

    //extract video url as response from cloudinary
    const response = await uploadMediaToCloudinary(req.file.path);

    const subSection = await SubSection.create({
      title,
      timeDuration: response.duration,
      description,
      video: response.secure_url,
    });

    //add subSection ID to section by sectionId
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      {
        $push: { subSection: subSection._id },
      },
      { new: true }
    );

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.SUBSECTIONS.CREATED,
        data: { updatedSection, subSection },
      })
    );
  }
);

export const updateSubSection = asyncHandler(
  async (req: Request, res: Response) => {
    const { sectionId, subSectionId } = req.params;
    const { title, description } = req.body;

    if (!sectionId || !subSectionId) {
      throw new ApiError({
        status: HTTP_STATUS.BAD_REQUEST,
        message: RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
      });
    }

    const subSection = await SubSection.findById(subSectionId);
    if (!subSection) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.SUBSECTIONS.NOT_FOUND,
      });
    }

    let response: { secure_url?: string; duration?: number } = {};
    if (req.file) {
      response = await uploadMediaToCloudinary(req.file.path);
    }

    const updatedSubSection = await SubSection.findByIdAndUpdate(
      subSectionId,
      {
        title,
        description,
        video: response.secure_url,
        timeDuration: response.duration,
      },
      { new: true }
    );

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.SUBSECTIONS.UPDATED,
        data: { updatedSubSection },
      })
    );
  }
);

export const deleteSubSection = asyncHandler(
  async (req: Request, res: Response) => {
    const { sectionId, subSectionId } = req.params;

    if (!sectionId || !subSectionId) {
      throw new ApiError({
        status: HTTP_STATUS.BAD_REQUEST,
        message: RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
      });
    }

    const section = await Section.findById(sectionId);
    if (!section) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.SECTIONS.NOT_FOUND,
      });
    }

    //remove subSection id from section-> subSection array
    await Section.updateOne(
      { _id: sectionId },
      { $pull: { subSection: subSectionId } }
    );

    const deletedSubSection = await SubSection.findByIdAndDelete(subSectionId);

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.SUBSECTIONS.DELETED,
        data: { deletedSubSection },
      })
    );
  }
);
