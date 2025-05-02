"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const user_1 = __importDefault(require("./user"));
const instructorSchema = new mongoose_1.Schema({
    earnings: {
        type: Number,
        default: 0,
    },
    courses: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Course",
            default: [],
        },
    ],
});
const Instructor = user_1.default.discriminator("Instructor", instructorSchema);
exports.default = Instructor;
