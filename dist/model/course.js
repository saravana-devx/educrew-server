"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const courseSchema = new mongoose_1.Schema({
    courseName: {
        type: String,
        required: true,
    },
    instructor: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    description: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    whatYouWillLearn: {
        type: [String],
        required: true,
    },
    content: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Section",
        },
    ],
    category: {
        type: String,
        required: true,
    },
    studentEnrolled: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    ratingAndReview: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "RatingAndReview",
        },
    ],
    status: {
        type: String,
        enum: ["Draft", "Published"],
        default: "Draft",
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    updatedAt: {
        type: Date,
        default: Date.now(),
    },
});
const Course = (0, mongoose_1.model)("Course", courseSchema);
exports.default = Course;
