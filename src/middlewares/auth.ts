import { Request, Response, NextFunction } from "express";
import asyncHandler from "./asyncHandler";

import { ApiError } from "../utils/apiResponseHandler/apiError";
import { HTTP_STATUS, RESPONSE_MESSAGES } from "../utils/constant";

import dotenv from "dotenv";

import User from "../model/user";
import jwt from "jsonwebtoken";

dotenv.config();

export const auth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.USERS.MISSING_TOKEN,
      });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new ApiError({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: RESPONSE_MESSAGES.USERS.MISSING_TOKEN,
      });
    }
    const secret = process.env.JWT_SECRET as jwt.Secret;
    const decode = jwt.verify(token, secret);
    req.currentUser = decode;
    next();
  }
);

export const admin = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const email = req.currentUser.email;
    const user = await User.findOne({ email }, { accountType: 1, _id: 0 });
    if (user && user.accountType === "Admin") {
      next();
    } else {
      throw new ApiError({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: RESPONSE_MESSAGES.USERS.UNAUTHORIZED,
      });
    }
  }
);

export const instructor = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const email = req.currentUser.email;
    const user = await User.findOne({ email }, { accountType: 1, _id: 0 });
    if (user && user.accountType === "Instructor") {
      next();
    } else {
      throw new ApiError({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: RESPONSE_MESSAGES.USERS.UNAUTHORIZED,
      });
    }
  }
);

export const student = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const email = req.currentUser.email;
    const user = await User.findOne({ email }, { accountType: 1, _id: 0 });
    if (user && user.accountType === "Student") {
      next();
    } else {
      throw new ApiError({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: RESPONSE_MESSAGES.USERS.UNAUTHORIZED,
      });
    }
  }
);
