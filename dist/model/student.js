"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const user_1 = __importDefault(require("./user"));
const studentSchema = new mongoose_1.Schema({
    enrolledCourses: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Course",
        },
    ],
    courseProgress: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "CourseProgress",
        },
    ],
});
const Student = user_1.default.discriminator("Student", studentSchema);
exports.default = Student;
