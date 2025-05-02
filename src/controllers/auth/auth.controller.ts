import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import bcrypt, { hash } from "bcrypt";
import jwt from "jsonwebtoken";

import fs from "fs";
import path from "path";

import asyncHandler from "../../middlewares/asyncHandler";

import { ApiError } from "../../utils/apiResponseHandler/apiError";
import { HTTP_STATUS, RESPONSE_MESSAGES } from "../../utils/constant";


import User from "../../model/user";
import Instructor from "../../model/instructor";
import Student from "../../model/student";
import Profile from "../../model/profile";

import mailSender from "../../utils/email/mailSender";
import { ApiResponse } from "../../utils/apiResponseHandler/apiResponse";

import dotenv from "dotenv";
dotenv.config();

const generateVerificationToken = (userId: string) => {
  const secret = process.env.JWT_SECRET as jwt.Secret;
  const token = jwt.sign({ userId }, secret, {
    expiresIn: "1h",
  });
  return token;
};

export const registerUser = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, accountType } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !accountType) {
      throw new ApiError({
        status: HTTP_STATUS.BAD_REQUEST,
        message: RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
      });
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new ApiError({
        status: HTTP_STATUS.BAD_REQUEST,
        message: errors.array()[0].msg,
      });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError({
        status: HTTP_STATUS.CONFLICT,
        message: RESPONSE_MESSAGES.USERS.EMAIL_ALREADY_IN_USE,
      });
    }

    // Encrypt the password
    const encryptedPassword = await bcrypt.hash(password, 10);

    // Create the additional profile details
    const additionalDetails = await Profile.create({
      gender: null,
      dob: null,
      about: null,
      contactNumber: null,
    });

    let user;

    // Create the user based on the account type
    if (accountType === "Instructor") {
      user = await Instructor.create({
        firstName,
        lastName,
        email,
        password: encryptedPassword,
        accountType,
        additionalDetails,
        image: "",
        earnings: 0,
        courses: [],
      });
    } else if (accountType === "Student") {
      user = await Student.create({
        firstName,
        lastName,
        email,
        password: encryptedPassword,
        accountType,
        additionalDetails,
        image: "",
        enrolledCourses: [],
        courseProgress: [],
      });
    } else if (accountType === "Admin") {
      user = await User.create({
        firstName,
        lastName,
        email,
        password: encryptedPassword,
        accountType,
        additionalDetails,
        image: "",
      });
    } else {
      throw new ApiError({
        status: HTTP_STATUS.BAD_REQUEST,
        message: "Invalid account type",
      });
    }

    const verificationToken = generateVerificationToken(user._id as string);

    // Update the user with the verification token
    user.verificationToken = verificationToken;

    await user.save();

    const verificationLink = `${process.env.Frontend_Production_url}/verify-email?token=${verificationToken}`;
    const templatePath = path.join(
      __dirname,
      "..",
      "..",
      "utils",
      "email",
      "templates",
      "verifyEmail.html"
    );
    let emailHtml = fs.readFileSync(templatePath, "utf8");

    // Replace the placeholder with the actual verification link
    emailHtml = emailHtml.replace(/{{verificationLink}}/g, verificationLink);

    // Send the verification email
    await mailSender(email, "Account Verification", emailHtml);

    res.status(HTTP_STATUS.CREATED).json(
      new ApiResponse({
        status: HTTP_STATUS.CREATED,
        message: RESPONSE_MESSAGES.USERS.REGISTER,
        data: { user },
      })
    );
  }),
];

export const loginUser = [
  body("email").isEmail().withMessage("Invalid email format").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),

  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new ApiError({
        status: HTTP_STATUS.BAD_REQUEST,
        message: errors.array()[0].msg,
      });
    }

    if (!email || !password) {
      throw new ApiError({
        status: HTTP_STATUS.BAD_REQUEST,
        message: RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
      });
    }

    let user = await User.findOne(
      { email },
      {
        email: 1,
        password: 1,
        _id: 1,
        accountType: 1,
        isVerified: 1,
        isActive: 1,
        image: 1,
        enrolledCourses: 1,
        courses: 1,
      }
    );

    if (!user) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.USERS.NOT_FOUND,
      });
    }

    // Check if the user account is active
    if (user.isActive === false) {
      throw new ApiError({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: RESPONSE_MESSAGES.USERS.UNVERIFIED_EMAIL,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new ApiError({
        status: HTTP_STATUS.CONFLICT,
        message: RESPONSE_MESSAGES.USERS.INVALID_PASSWORD,
      });
    }

    const secret = process.env.JWT_SECRET as jwt.Secret;

    // Prepare token payload
    const tokenPayload = {
      email: user.email,
      id: user._id,
      role: user.accountType,
    };

    const token = jwt.sign(tokenPayload, secret, { expiresIn: "24h" });

    const options: object = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    // Exclude the password from the user object in the response
    user.password = "";

    res
      .cookie("token", token, options)
      .status(HTTP_STATUS.OK)
      .json(
        new ApiResponse({
          status: HTTP_STATUS.OK,
          message: RESPONSE_MESSAGES.USERS.LOGIN,
          data: { token, user },
        })
      );
  }),
];

export const confirmEmail = asyncHandler(
  async (req: Request, res: Response) => {
    // Extract token and ensure it's a string
    const token = req.query.token as string | undefined;

    if (!token) {
      throw new ApiError({
        status: 400,
        message: "Token is required.",
      });
    }

    try {
      const secret = process.env.JWT_SECRET as jwt.Secret;

      const decoded = jwt.verify(token, secret) as { userId: string }; // Cast to expected type
      const userId = decoded.userId;

      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError({
          status: HTTP_STATUS.NOT_FOUND,
          message: RESPONSE_MESSAGES.USERS.NOT_FOUND,
        });
      }

      // Mark the user as verified
      user.isActive = true;
      // user.verificationToken = undefined;
      //Remove the verificationToken in user data
      user.verificationToken = "";
      await user.save();

      res.status(200).json(
        new ApiResponse({
          status: HTTP_STATUS.OK,
          message: RESPONSE_MESSAGES.USERS.EMAIL_VERIFIED,
        })
      );
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new ApiError({
          status: HTTP_STATUS.BAD_REQUEST,
          message: RESPONSE_MESSAGES.USERS.VERIFICATION_TOKEN_EXPIRED,
        });
      } else {
        throw new ApiError({
          status: HTTP_STATUS.BAD_REQUEST,
          message: RESPONSE_MESSAGES.USERS.VERIFICATION_TOKEN_EXPIRED,
        });
      }
    }
  }
);

export const updateUserPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const { email } = req.currentUser;

    const user = await User.findOne({ email }, { password: 1 });
    
    //compare oldPassword and saved password hashed value
    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      throw new ApiError({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: RESPONSE_MESSAGES.USERS.INVALID_PASSWORD,
      });
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      throw new ApiError({
        status: HTTP_STATUS.BAD_REQUEST,
        message: RESPONSE_MESSAGES.USERS.SAME_PASSWORD,
      });
    }

    if (newPassword !== confirmPassword) {
      throw new ApiError({
        status: HTTP_STATUS.CONFLICT,
        message: RESPONSE_MESSAGES.USERS.INVALID_PASSWORD,
      });
    }

    const encryptedNewPassword = await bcrypt.hash(newPassword, 10);

    //save new hashed password
    await User.findOneAndUpdate({ email }, { password: encryptedNewPassword });

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.USERS.PASSWORD_UPDATED,
      })
    );
  }
);

export const sendPasswordResetEmail = [
  body("email").isEmail().withMessage("Invalid email format"),
  asyncHandler(async (req: Request, res: Response) => {
    const email = req.body.email;

    if (!email) {
      throw new ApiError({
        status: HTTP_STATUS.BAD_REQUEST,
        message: RESPONSE_MESSAGES.USERS.EMAIL_NOT_FOUND,
      });
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new ApiError({
        status: HTTP_STATUS.BAD_REQUEST,
        message: errors.array()[0].msg,
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.USERS.NOT_FOUND,
      });
    }

    const verificationToken = generateVerificationToken(user._id as string);
    user.verificationToken = verificationToken;
    await user.save();

    const verificationLink = `${process.env.Frontend_Production_url}/reset-password?token=${verificationToken}`;

    // Path to your email template
    const templatePath = path.join(
      __dirname,
      "..",
      "..",
      "utils",
      "email",
      "templates",
      "forgotPassword.html"
    );

    let emailHtml = fs.readFileSync(templatePath, "utf8");
    // Replace all occurrences of {{verificationLink}} with the actual verification link
    emailHtml = emailHtml.replace(/{{verificationLink}}/g, verificationLink);

    await mailSender(email, "Generate a new password", emailHtml);

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.USERS.EMAIL_SENT,
      })
    );
  }),
];

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { newPassword, confirmPassword } = req.body;
    const token = req.query.token as string | undefined;

    if (!token) {
      throw new ApiError({
        status: HTTP_STATUS.BAD_REQUEST,
        message: RESPONSE_MESSAGES.USERS.MISSING_TOKEN,
      });
    }

    const secret = process.env.JWT_SECRET as jwt.Secret;

    const decoded = jwt.verify(token, secret) as { userId: string }; // Cast to expected type
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.USERS.NOT_FOUND,
      });
    }
    if (!newPassword || !confirmPassword) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
      });
    }

    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    // delete the verification token in database of user
    user.verificationToken = "";
    //save new hashed password
    await User.findByIdAndUpdate(user._id, {
      password: encryptedPassword,
    });

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.USERS.PASSWORD_UPDATED,
      })
    );
  }
);

export const toggleUserActiveStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, isActive } = req.body;

    if (!userId || typeof isActive !== "boolean") {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
      });
    }

    //update the active status
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    );

    if (!updatedUser) {
      throw new ApiError({
        status: 404,
        message: RESPONSE_MESSAGES.USERS.NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.USERS.USER_STATUS,
        data: { user: updatedUser },
      })
    );
  }
);
