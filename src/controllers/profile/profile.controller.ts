import { Request, Response } from "express";

import asyncHandler from "../../middlewares/asyncHandler";

import { ApiError } from "../../utils/apiResponseHandler/apiError";
import { ApiResponse } from "../../utils/apiResponseHandler/apiResponse";
import { HTTP_STATUS, RESPONSE_MESSAGES } from "../../utils/constant";
import uploadMediaToCloudinary from "../../utils/cloudinary/uploadMediaToCloudinary";

import User from "../../model/user";
import Course from "../../model/course";
import Profile from "../../model/profile";
import Instructor from "../../model/instructor";
import mongoose from "mongoose";

export const getProfileDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.currentUser.id;

    const userDetails = await User.findById(id)
      .select("-password -isVerified  -courses -createdAt -updatedAt")
      .populate("additionalDetails")
      .exec();

    if (!userDetails) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.USERS.NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.USERS.FOUND,
        data: { userDetails },
      })
    );
  }
);

export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.body && Object.keys(req.body).length === 0 && !req.file) {
      throw new ApiError({
        status: HTTP_STATUS.BAD_REQUEST,
        message: RESPONSE_MESSAGES.USERS.NO_DATA_PROVIDED,
      });
    }
    const { firstName, lastName, gender, dob, about, contactNumber } = req.body;
    const user = req.currentUser;

    let imageUrl;
    if (req.file) {
      const response = await uploadMediaToCloudinary(req.file.path);
      imageUrl = response.secure_url;
    }
    const newProfileDetails = await User.findByIdAndUpdate(
      user.id,
      {
        $set: {
          firstName,
          lastName,
          image: imageUrl,
        },
      },
      { new: true }
    );

    await Profile.findByIdAndUpdate(
      newProfileDetails?.additionalDetails,
      {
        $set: {
          gender,
          dob,
          about,
          contactNumber,
        },
      },
      { new: true }
    );
    const updatedProfile = await User.findById(user.id)
      .select(
        "-password -isVerified -approve  -courseProgress  -createdAt -updatedAt"
      ) // Exclude the password field
      .populate("additionalDetails")
      .exec();

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.USERS.UPDATED,
        data: { updatedProfile },
      })
    );
  }
);

export const deleteAccount = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.currentUser;

    const deletedAccount = await User.findByIdAndDelete(id);

    if (!deletedAccount) {
      throw new ApiError({
        status: HTTP_STATUS.CONFLICT,
        message: RESPONSE_MESSAGES.USERS.NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.USERS.DELETED,
        data: { deletedAccount },
      })
    );
  }
);

export const deleteAccountByAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: "User not found",
      });
    }

    const deleteUser = await User.deleteOne({ _id: userId });

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: "User Account Deleted Successfully",
      })
    );
  }
);

export const getInstructorDashboard = asyncHandler(
  async (req: Request, res: Response) => {
    const instructorId = req.currentUser.id;
    const instructor = await Instructor.findById(instructorId);

    if (!instructor) {
      throw new ApiError({
        status: HTTP_STATUS.BAD_REQUEST,
        message: RESPONSE_MESSAGES.USERS.NOT_FOUND,
      });
    }
    const pipeline = [
      {
        $match: {
          instructor: new mongoose.Types.ObjectId(instructorId),
        },
      },
      {
        $project: {
          _id: 1,
          courseName: 1,
          price: 1,
          totalStudentsEnrolled: { $size: "$studentEnrolled" },
          status: 1,
        },
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
          averageRating: { $ifNull: [{ $avg: "$ratings.rating" }, 0] },
        },
      },
      {
        $unset: "ratings",
      },
    ];
    const courseData = await Course.aggregate(pipeline);
    if (!courseData) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.USERS.NO_COURSE_CREATED,
      });
    }
    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.USERS.INSTRUCTOR_DASHBOARD_SUMMARY,
        data: {
          courses: courseData,
          totalEarnings: instructor.earnings,
        },
      })
    );
  }
);

export const getEarningByMonth = asyncHandler(
  async (req: Request, res: Response) => {
    const instructorId = req.currentUser.id;
    const earningsByMonth = await Course.aggregate([
      {
        $match: {
          $and: [
            // { status: "Published" },
            {
              instructor: new mongoose.Types.ObjectId(instructorId),
            },
          ],
        },
      },
      {
        $project: {
          courseName: 1,
          price: 1,
          studentCount: { $size: "$studentEnrolled" },
          createdAtMonth: {
            $dateToString: {
              format: "%Y-%m",
              date: "$createdAt",
            },
          },
          earnings: {
            $multiply: [{ $size: "$studentEnrolled" }, "$price"],
          },
        },
      },
      {
        $group: {
          _id: "$createdAtMonth", // Group by month (year-month)
          totalEarnings: { $sum: "$earnings" }, // Sum the earnings for each month
        },
      },
      {
        $sort: { _id: 1 }, // Sort by the month (ascending)
      },
    ]);

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.USERS.EARNING_BY_MONTH,
        data: earningsByMonth,
      })
    );
  }
);

export const getEarningByCourses = asyncHandler(
  async (req: Request, res: Response) => {
    const instructorId = req.currentUser.id;

    const earningsByCourse = await Course.aggregate([
      {
        $match: {
          $and: [
            // { status: "Published" },
            {
              instructor: new mongoose.Types.ObjectId(instructorId),
            },
          ],
        },
      },
      {
        $project: {
          courseName: 1,
          price: 1,
          studentCount: { $size: "$studentEnrolled" },
          earnings: { $multiply: [{ $size: "$studentEnrolled" }, "$price"] },
        },
      },
      {
        $match: {
          studentCount: { $gt: 0 }, // Filter courses where studentCount > 0
        },
      },
      {
        $sort: { earnings: -1 }, // Sort by earnings in descending order
      },
    ]);

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.USERS.EARNING_BY_COURSE,
        data: earningsByCourse,
      })
    );
  }
);

export const getCoursesInfoForAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "instructor",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: {
          path: "$userInfo",
        },
      },
      {
        $project: {
          _id: 1,
          courseName: 1,
          instructor: {
            $concat: ["$userInfo.firstName", "$userInfo.lastName"],
          },
          price: 1,
          studentEnrolled: {
            $size: "$studentEnrolled",
          },
        },
      },
      { $unset: "userInfo" },

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
          averageRating: {
            $ifNull: [{ $avg: "$ratings.rating" }, 0],
          },
        },
      },
      {
        $unset: "ratings",
      },
    ];

    const courses = await Course.aggregate(pipeline);
    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.USERS.ADMIN_DASHBOARD_COURSE_DETAILS,
        data: { courses },
      })
    );
  }
);

export const getUsersInfoForAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const pipeline = [
      {
        $project: {
          name: {
            $concat: ["$firstName", "$lastName"],
          },
          email: 1,
          accountType: 1,
          isActive: 1,
        },
      },
    ];

    const users = await User.aggregate(pipeline);

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.USERS.ADMIN_DASHBOARD_USER_DETAILS,
        data: { users },
      })
    );
  }
);

export const getTotalStudentAndInstructor = asyncHandler(
  async (req: Request, res: Response) => {
    const users = await User.aggregate([
      {
        $match: {
          accountType: {
            $in: ["Student", "Instructor"],
          },
        },
      },
      {
        $group: {
          _id: "$accountType",
          count: {
            $sum: 1,
          },
        },
      },
    ]);
    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: "Total no of Student and Instructor.",
        data: users,
      })
    );
  }
);

export const getMostEnrolledCourses = asyncHandler(
  async (req: Request, res: Response) => {
    const courses = await Course.aggregate([
      {
        $project: {
          courseName: 1,
          totalStudents: {
            $size: "$studentEnrolled",
          },
        },
      },
      {
        $match: {
          totalStudents: { $gt: 0 }, // Filter courses where studentCount > 0
        },
      },
      {
        $sort: {
          totalStudents: -1,
        },
      },
      {
        $limit: 10,
      },
    ]);
    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: "Most enrolled courses by student.",
        data: courses,
      })
    );
  }
);
