"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const courseProgressSchema = new mongoose_1.Schema({
    courseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "course",
        required: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    completedVideos: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "subSection",
        },
    ],
});
const CourseProgress = (0, mongoose_1.model)("CourseProgress", courseProgressSchema);
exports.default = CourseProgress;
