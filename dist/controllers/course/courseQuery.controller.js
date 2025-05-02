"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopCourses = exports.getSearchResults = exports.getCourseByCategory = void 0;
const asyncHandler_1 = __importDefault(require("../../middlewares/asyncHandler"));
const apiError_1 = require("../../utils/apiResponseHandler/apiError");
const apiResponse_1 = require("../../utils/apiResponseHandler/apiResponse");
const constant_1 = require("../../utils/constant");
const course_1 = __importDefault(require("../../model/course"));
exports.getCourseByCategory = (0, asyncHandler_1.default)(async (req, res) => {
    const { category } = req.params;
    const courses = await course_1.default.find({ category }).populate({
        path: "instructor",
        model: "User",
        select: "firstName lastName image",
    });
    const totalCourses = courses.length;
    if (courses.length === 0) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COURSES.NOT_FOUND,
        });
    }
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.COURSES.CATEGORY_FOUND,
        data: { courses, totalCourses },
    }));
});
exports.getSearchResults = (0, asyncHandler_1.default)(async (req, res) => {
    const { searchQuery } = req.params;
    if (!searchQuery || typeof searchQuery !== "string") {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.BAD_REQUEST,
            message: constant_1.RESPONSE_MESSAGES.COURSES.INVALID_SEARCH_QUERY,
        });
    }
    const searchResults = await course_1.default.find({
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
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COURSES.NOT_FOUND,
        });
    }
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.COURSES.SEARCH_RESULTS,
        data: { searchResults },
    }));
});
exports.getTopCourses = (0, asyncHandler_1.default)(async (req, res) => {
    const topCourses = await course_1.default.find()
        .populate("instructor")
        .sort({ studentEnrolled: -1 })
        .limit(8);
    if (!topCourses) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COURSES.NOT_FOUND,
        });
    }
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.COURSES.FOUND,
        data: topCourses,
    }));
});
