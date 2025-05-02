"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const profileSchema = new mongoose_1.Schema({
    gender: {
        type: String,
        enum: ["male", "female"],
    },
    dob: {
        type: Date,
    },
    about: {
        type: String,
    },
    contactNumber: {
        type: String,
    },
});
const Profile = (0, mongoose_1.model)("Profile", profileSchema);
exports.default = Profile;
