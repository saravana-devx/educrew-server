"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.student = exports.instructor = exports.admin = exports.auth = void 0;
const asyncHandler_1 = __importDefault(require("./asyncHandler"));
const apiError_1 = require("../utils/apiResponseHandler/apiError");
const constant_1 = require("../utils/constant");
const dotenv_1 = __importDefault(require("dotenv"));
const user_1 = __importDefault(require("../model/user"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
exports.auth = (0, asyncHandler_1.default)(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.USERS.MISSING_TOKEN,
        });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.UNAUTHORIZED,
            message: constant_1.RESPONSE_MESSAGES.USERS.MISSING_TOKEN,
        });
    }
    const secret = process.env.JWT_SECRET;
    const decode = jsonwebtoken_1.default.verify(token, secret);
    req.currentUser = decode;
    next();
});
exports.admin = (0, asyncHandler_1.default)(async (req, res, next) => {
    const email = req.currentUser.email;
    const user = await user_1.default.findOne({ email }, { accountType: 1, _id: 0 });
    if (user && user.accountType === "Admin") {
        next();
    }
    else {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.UNAUTHORIZED,
            message: constant_1.RESPONSE_MESSAGES.USERS.UNAUTHORIZED,
        });
    }
});
exports.instructor = (0, asyncHandler_1.default)(async (req, res, next) => {
    const email = req.currentUser.email;
    const user = await user_1.default.findOne({ email }, { accountType: 1, _id: 0 });
    if (user && user.accountType === "Instructor") {
        next();
    }
    else {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.UNAUTHORIZED,
            message: constant_1.RESPONSE_MESSAGES.USERS.UNAUTHORIZED,
        });
    }
});
exports.student = (0, asyncHandler_1.default)(async (req, res, next) => {
    const email = req.currentUser.email;
    const user = await user_1.default.findOne({ email }, { accountType: 1, _id: 0 });
    if (user && user.accountType === "Student") {
        next();
    }
    else {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.UNAUTHORIZED,
            message: constant_1.RESPONSE_MESSAGES.USERS.UNAUTHORIZED,
        });
    }
});
