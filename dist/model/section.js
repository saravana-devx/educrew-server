"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const sectionSchema = new mongoose_1.Schema({
    sectionName: {
        type: String,
    },
    subSection: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "subSection",
        },
    ],
});
const Section = (0, mongoose_1.model)("Section", sectionSchema);
exports.default = Section;
