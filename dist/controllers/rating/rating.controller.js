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
exports.getAllRatingByCourse = exports.getAverageRating = exports.addRatingAndReview = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const asyncHandler_1 = __importDefault(require("../../middlewares/asyncHandler"));
const apiError_1 = require("../../utils/apiResponseHandler/apiError");
const apiResponse_1 = require("../../utils/apiResponseHandler/apiResponse");
const constant_1 = require("../../utils/constant");
const student_1 = __importDefault(require("../../model/student"));
const course_1 = __importDefault(require("../../model/course"));
const ratingAndReview_1 = __importDefault(require("../../model/ratingAndReview"));
exports.addRatingAndReview = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseId } = req.params;
    const { rating, review } = req.body;
    const { id } = req.currentUser;
    const student = yield student_1.default.findById(id);
    if (!student) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.USERS.NOT_FOUND,
        });
    }
    if (!courseId ||
        !rating ||
        !review ||
        isNaN(rating) ||
        rating < 1 ||
        rating > 5) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.BAD_REQUEST,
            message: constant_1.RESPONSE_MESSAGES.RATING_AND_REVIEWS.INVALID_FORMAT,
        });
    }
    const ratingAndReview = yield ratingAndReview_1.default.create({
        user: id,
        rating,
        review,
        course: courseId,
    });
    //add ratingAndReview ID to course by ratingId
    const course = yield course_1.default.findByIdAndUpdate(courseId, {
        $push: {
            ratingAndReview: ratingAndReview._id,
        },
    }, { new: true });
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.RATING_AND_REVIEWS.ADDED,
        data: { ratingAndReview, course },
    }));
}));
exports.getAverageRating = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseId } = req.params;
    if (!courseId) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COURSES.NOT_FOUND,
        });
    }
    const pipeline = [
        {
            //Why does we use "new" keyword here ??
            $match: { _id: new mongoose_1.default.Types.ObjectId(courseId) },
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
                averageRating: { $avg: "$ratings.rating" },
            },
        },
        {
            $unset: "ratings",
        },
    ];
    const result = yield course_1.default.aggregate(pipeline);
    if (result.length === 0) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.RATING_AND_REVIEWS.COURSE_NOT_FOUND_OR_NO_RATINGS,
        });
    }
    const averageRating = result[0].averageRating;
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.RATING_AND_REVIEWS.AVERAGE_RATING,
        data: { averageRating },
    }));
}));
exports.getAllRatingByCourse = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseId } = req.params;
    if (!courseId) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COURSES.NOT_FOUND,
        });
    }
    const ratingAndReviews = yield ratingAndReview_1.default.find({ course: courseId })
        .populate({ path: "user", select: "firstName lastName -_id" })
        .exec();
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.RATING_AND_REVIEWS.COURSE_RATINGS_FOUND,
        data: { ratingAndReviews },
    }));
}));
