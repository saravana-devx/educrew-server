import { Request, Response } from "express";

import asyncHandler from "../../middlewares/asyncHandler";

import { ApiError } from "../../utils/apiResponseHandler/apiError";
import { HTTP_STATUS, RESPONSE_MESSAGES } from "../../utils/constant";

import Contact from "../../model/contact";

export const postQuery = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, phone, message } = req.body;

  if (!firstName || !lastName || !email || !phone || !message) {
    throw new ApiError({
      status: HTTP_STATUS.BAD_REQUEST,
      message: RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
    });
  }

  const newQuery = await Contact.create({
    firstName,
    lastName,
    email,
    phone,
    message,
  });

  res.status(HTTP_STATUS.CREATED).json({
    status: HTTP_STATUS.CREATED,
    message: RESPONSE_MESSAGES.CONTACT.QUERY_SENT,
    data: newQuery,
  });
});

export const deleteQuery = asyncHandler(async (req: Request, res: Response) => {
  const { queryId } = req.params;

  if (!queryId) {
    throw new ApiError({
      status: HTTP_STATUS.BAD_REQUEST,
      message: RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
    });
  }

  const deletedQuery = await Contact.findByIdAndDelete(queryId);

  if (!deletedQuery) {
    throw new ApiError({
      status: HTTP_STATUS.NOT_FOUND,
      message: RESPONSE_MESSAGES.CONTACT.NOT_FOUND,
    });
  }

  res.status(HTTP_STATUS.OK).json({
    status: HTTP_STATUS.OK,
    message: RESPONSE_MESSAGES.CONTACT.QUERY_DELETED,
  });
});
