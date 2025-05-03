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
exports.getMostEnrolledCourses = exports.getTotalStudentAndInstructor = exports.getUsersInfoForAdmin = exports.getCoursesInfoForAdmin = exports.getEarningByCourses = exports.getEarningByMonth = exports.getInstructorDashboard = exports.deleteAccountByAdmin = exports.deleteAccount = exports.updateProfile = exports.getProfileDetails = void 0;
const asyncHandler_1 = __importDefault(require("../../middlewares/asyncHandler"));
const apiError_1 = require("../../utils/apiResponseHandler/apiError");
const apiResponse_1 = require("../../utils/apiResponseHandler/apiResponse");
const constant_1 = require("../../utils/constant");
const uploadMediaToCloudinary_1 = __importDefault(require("../../utils/cloudinary/uploadMediaToCloudinary"));
const user_1 = __importDefault(require("../../model/user"));
const course_1 = __importDefault(require("../../model/course"));
const profile_1 = __importDefault(require("../../model/profile"));
const instructor_1 = __importDefault(require("../../model/instructor"));
const mongoose_1 = __importDefault(require("mongoose"));
exports.getProfileDetails = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.currentUser.id;
    const userDetails = yield user_1.default.findById(id)
        .select("-password -isVerified  -courses -createdAt -updatedAt")
        .populate("additionalDetails")
        .exec();
    if (!userDetails) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.USERS.NOT_FOUND,
        });
    }
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.USERS.FOUND,
        data: { userDetails },
    }));
}));
exports.updateProfile = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body && Object.keys(req.body).length === 0 && !req.file) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.BAD_REQUEST,
            message: constant_1.RESPONSE_MESSAGES.USERS.NO_DATA_PROVIDED,
        });
    }
    const { firstName, lastName, gender, dob, about, contactNumber } = req.body;
    const user = req.currentUser;
    let imageUrl;
    if (req.file) {
        const response = yield (0, uploadMediaToCloudinary_1.default)(req.file.path);
        imageUrl = response.secure_url;
    }
    const newProfileDetails = yield user_1.default.findByIdAndUpdate(user.id, {
        $set: {
            firstName,
            lastName,
            image: imageUrl,
        },
    }, { new: true });
    yield profile_1.default.findByIdAndUpdate(newProfileDetails === null || newProfileDetails === void 0 ? void 0 : newProfileDetails.additionalDetails, {
        $set: {
            gender,
            dob,
            about,
            contactNumber,
        },
    }, { new: true });
    const updatedProfile = yield user_1.default.findById(user.id)
        .select("-password -isVerified -approve  -courseProgress  -createdAt -updatedAt") // Exclude the password field
        .populate("additionalDetails")
        .exec();
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.USERS.UPDATED,
        data: { updatedProfile },
    }));
}));
exports.deleteAccount = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.currentUser;
    const deletedAccount = yield user_1.default.findByIdAndDelete(id);
    if (!deletedAccount) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.CONFLICT,
            message: constant_1.RESPONSE_MESSAGES.USERS.NOT_FOUND,
        });
    }
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.USERS.DELETED,
        data: { deletedAccount },
    }));
}));
exports.deleteAccountByAdmin = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const user = yield user_1.default.findById(userId);
    if (!user) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: "User not found",
        });
    }
    const deleteUser = yield user_1.default.deleteOne({ _id: userId });
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: "User Account Deleted Successfully",
    }));
}));
exports.getInstructorDashboard = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const instructorId = req.currentUser.id;
    const instructor = yield instructor_1.default.findById(instructorId);
    if (!instructor) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.BAD_REQUEST,
            message: constant_1.RESPONSE_MESSAGES.USERS.NOT_FOUND,
        });
    }
    const pipeline = [
        {
            $match: {
                instructor: new mongoose_1.default.Types.ObjectId(instructorId),
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
    const courseData = yield course_1.default.aggregate(pipeline);
    if (!courseData) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.USERS.NO_COURSE_CREATED,
        });
    }
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.USERS.INSTRUCTOR_DASHBOARD_SUMMARY,
        data: {
            courses: courseData,
            totalEarnings: instructor.earnings,
        },
    }));
}));
exports.getEarningByMonth = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const instructorId = req.currentUser.id;
    const earningsByMonth = yield course_1.default.aggregate([
        {
            $match: {
                $and: [
                    // { status: "Published" },
                    {
                        instructor: new mongoose_1.default.Types.ObjectId(instructorId),
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
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.USERS.EARNING_BY_MONTH,
        data: earningsByMonth,
    }));
}));
exports.getEarningByCourses = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const instructorId = req.currentUser.id;
    const earningsByCourse = yield course_1.default.aggregate([
        {
            $match: {
                $and: [
                    // { status: "Published" },
                    {
                        instructor: new mongoose_1.default.Types.ObjectId(instructorId),
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
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.USERS.EARNING_BY_COURSE,
        data: earningsByCourse,
    }));
}));
exports.getCoursesInfoForAdmin = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const courses = yield course_1.default.aggregate(pipeline);
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.USERS.ADMIN_DASHBOARD_COURSE_DETAILS,
        data: { courses },
    }));
}));
exports.getUsersInfoForAdmin = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const users = yield user_1.default.aggregate(pipeline);
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.USERS.ADMIN_DASHBOARD_USER_DETAILS,
        data: { users },
    }));
}));
exports.getTotalStudentAndInstructor = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield user_1.default.aggregate([
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
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: "Total no of Student and Instructor.",
        data: users,
    }));
}));
exports.getMostEnrolledCourses = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const courses = yield course_1.default.aggregate([
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
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: "Most enrolled courses by student.",
        data: courses,
    }));
}));
