"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const subSectionSchema = new mongoose_1.Schema({
    title: {
        type: String,
    },
    timeDuration: {
        type: String,
    },
    description: {
        type: String,
    },
    video: {
        type: String,
    },
});
const SubSection = (0, mongoose_1.model)("SubSection", subSectionSchema);
exports.default = SubSection;
