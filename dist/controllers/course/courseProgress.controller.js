"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCourseProgress = exports.getCourseProgress = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const asyncHandler_1 = __importDefault(require("../../middlewares/asyncHandler"));
const apiError_1 = require("../../utils/apiResponseHandler/apiError");
const apiResponse_1 = require("../../utils/apiResponseHandler/apiResponse");
const constant_1 = require("../../utils/constant");
const student_1 = __importDefault(require("../../model/student"));
const courseProgress_1 = __importDefault(require("../../model/courseProgress"));
const course_1 = __importDefault(require("../../model/course"));
exports.getCourseProgress = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const studentId = req.currentUser.id;
    // Fetch the student's enrolled courses
    const student = yield student_1.default.findById(studentId);
    if (!student || student.enrolledCourses.length === 0) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COURSES.USER_NOT_ENROLLED,
        });
    }
    const enrolledCourseIds = student.enrolledCourses.map((id) => new mongoose_1.default.Types.ObjectId(id));
    //Fetch course progress (completed videos)
    const courseProgressResults = yield courseProgress_1.default.aggregate([
        {
            $match: {
                userId: new mongoose_1.default.Types.ObjectId(studentId),
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
    const totalVideosResults = yield course_1.default.aggregate([
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
        var _a;
        const totalVideos = ((_a = totalVideosResults.find((course) => course.courseId.toString() === progress.courseId.toString())) === null || _a === void 0 ? void 0 : _a.totalVideos) || 0;
        return {
            courseId: progress.courseId,
            completedVideos: progress.completedVideos,
            totalVideos,
        };
    });
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.COURSES.COURSE_PROGRESS,
        data: {
            progressWithTotalVideos,
        },
    }));
}));
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
exports.updateCourseProgress = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.currentUser.id;
    const { courseId, subSectionId } = req.params;
    // Fetch the user
    const student = yield student_1.default.findById(id);
    if (!student) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.USERS.NOT_FOUND,
        });
    }
    // Check if progress for the course already exists
    let progressForCourse = yield courseProgress_1.default.findOne({
        courseId: courseId,
        userId: id,
    });
    if (!progressForCourse) {
        // Create new CourseProgress if it doesn't exist
        progressForCourse = new courseProgress_1.default({
            courseId: courseId,
            userId: id,
            completedVideos: [subSectionId],
        });
        yield progressForCourse.save();
        // Add the new CourseProgress reference to the user
        // student.courseProgress.push(progressForCourse._id);
        yield student.save();
        yield student_1.default.findByIdAndUpdate(id, {
            $set: {
                courseProgress: progressForCourse._id,
            },
        }, { new: true });
        yield student.save();
    }
    else {
        // Update the existing CourseProgress
        yield courseProgress_1.default.findByIdAndUpdate(progressForCourse._id, { $addToSet: { completedVideos: subSectionId } }, // Prevent duplicates
        { new: true });
    }
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.COURSES.PROGRESS_UPDATED,
        data: {
            courseProgress: student.courseProgress,
            course: progressForCourse,
        },
    }));
}));
