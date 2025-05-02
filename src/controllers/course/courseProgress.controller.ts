import { Request, Response } from "express";
import mongoose, { ObjectId, Schema, Types } from "mongoose";

import asyncHandler from "../../middlewares/asyncHandler";

import { ApiError } from "../../utils/apiResponseHandler/apiError";
import { ApiResponse } from "../../utils/apiResponseHandler/apiResponse";
import { HTTP_STATUS, RESPONSE_MESSAGES } from "../../utils/constant";

import Student from "../../model/student";
import CourseProgress from "../../model/courseProgress";
import Course from "../../model/course";

export const getCourseProgress = asyncHandler(
  async (req: Request, res: Response) => {

    const studentId = req.currentUser.id;
    // Fetch the student's enrolled courses
    const student = await Student.findById(studentId)

    if (!student || student.enrolledCourses.length === 0) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.COURSES.USER_NOT_ENROLLED,
      });
    }
    const enrolledCourseIds = student.enrolledCourses.map(
      (id) => new mongoose.Types.ObjectId(id)
    );


    //Fetch course progress (completed videos)
    const courseProgressResults = await CourseProgress.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(studentId),
          courseId: { $in: enrolledCourseIds },
        },
      },
      {
        $project: {
          courseId: 1,
          completedVideos: 1, // Include the list of completed video IDs
          completedVideosCount: { $size: "$completedVideos" },
        },
      },
    ]);
    //Fetch total videos for each course
    const totalVideosResults = await Course.aggregate([
      {
        $match: { _id: { $in: enrolledCourseIds } },
      },
      {
        $lookup: {
          from: "sections",
          localField: "content",
          foreignField: "_id",
          as: "sections",
        },
      },
      { $unwind: "$sections" },
      {
        $lookup: {
          from: "subsections",
          localField: "sections.subSection",
          foreignField: "_id",
          as: "subSections",
        },
      },
      { $unwind: "$subSections" },
      {
        $group: {
          _id: "$_id",
          totalVideos: { $sum: 1 },
        },
      },
      {
        $project: {
          courseId: "$_id",
          totalVideos: 1,
          _id: 0,
        },
      },
    ]);

    //Combine progress and total video counts
    const progressWithTotalVideos = courseProgressResults.map((progress) => {
      const totalVideos =
        totalVideosResults.find(
          (course) =>
            course.courseId.toString() === progress.courseId.toString()
        )?.totalVideos || 0;

      return {
        courseId: progress.courseId,
        completedVideos: progress.completedVideos,
        totalVideos,
      };
    });
    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.COURSES.COURSE_PROGRESS,
        data: {
          progressWithTotalVideos,
        },
      })
    );
  }
);


// export const updateCourseProgress = asyncHandler(
//   async (req: Request, res: Response) => {
//     const userId = req.currentUser.id;
//     const { courseId, subSectionId } = req.params;

//     const user = await Student.findById(userId);

//     if (!user) {
//       throw new ApiError({
//         status: HTTP_STATUS.NOT_FOUND,
//         message: RESPONSE_MESSAGES.USERS.NOT_FOUND,
//       });
//     }

//     // Check if progress for the course already exists
//     let progressForCourse = await CourseProgress.findOne({
//       courseId: courseId,
//       userId: userId,
//     });

//     if (!progressForCourse) {
//       // Create new CourseProgress if it doesn't exist
//       progressForCourse = new CourseProgress({
//         courseId: courseId,
//         userId: userId,
//         completedVideos: [subSectionId],
//       });
//       await progressForCourse.save();

//       // Add the new CourseProgress reference to the user
//       await Student.findByIdAndUpdate(
//         userId,
//         {
//           $set: {
//             courseProgress: progressForCourse._id,
//           },
//         },
//         { new: true }
//       );

//       await user.save();
//     } else {
//       //update existing course progress
//       await CourseProgress.findByIdAndUpdate(
//         progressForCourse._id,
//         { $addToSet: { completedVideos: subSectionId } }, // Prevent duplicates
//         { new: true }
//       );
//     }
//     res.status(HTTP_STATUS.OK).json(
//       new ApiResponse({
//         status: HTTP_STATUS.OK,
//         message: RESPONSE_MESSAGES.COURSES.PROGRESS_UPDATED,
//         data: {
//           courseProgress: user.courseProgress,
//           course: progressForCourse,
//         },
//       })
//     );
//   }
// );

export const updateCourseProgress = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.currentUser.id;
    const { courseId, subSectionId } = req.params;
    // Fetch the user
    const student = await Student.findById(id);

    if (!student) {
      throw new ApiError({
        status: HTTP_STATUS.NOT_FOUND,
        message: RESPONSE_MESSAGES.USERS.NOT_FOUND,
      });
    }

    // Check if progress for the course already exists
    let progressForCourse = await CourseProgress.findOne({
      courseId: courseId,
      userId: id,
    });

    if (!progressForCourse) {
      // Create new CourseProgress if it doesn't exist
      progressForCourse = new CourseProgress({
        courseId: courseId,
        userId: id,
        completedVideos: [subSectionId],
      });
      await progressForCourse.save();

      // Add the new CourseProgress reference to the user
      // student.courseProgress.push(progressForCourse._id);
      await student.save();
      await Student.findByIdAndUpdate(
        id,
        {
          $set: {
            courseProgress: progressForCourse._id,
          },
        },
        { new: true }
      );

      await student.save();
    } else {
      // Update the existing CourseProgress
      await CourseProgress.findByIdAndUpdate(
        progressForCourse._id,
        { $addToSet: { completedVideos: subSectionId } }, // Prevent duplicates
        { new: true }
      );
    }
    res.status(HTTP_STATUS.OK).json(
      new ApiResponse({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGES.COURSES.PROGRESS_UPDATED,
        data: {
          courseProgress: student.courseProgress,
          course: progressForCourse,
        },
      })
    );
  }
);
