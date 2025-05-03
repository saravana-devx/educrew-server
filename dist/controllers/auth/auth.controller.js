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
exports.toggleUserActiveStatus = exports.resetPassword = exports.sendPasswordResetEmail = exports.updateUserPassword = exports.confirmEmail = exports.loginUser = exports.registerUser = void 0;
const express_validator_1 = require("express-validator");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const asyncHandler_1 = __importDefault(require("../../middlewares/asyncHandler"));
const apiError_1 = require("../../utils/apiResponseHandler/apiError");
const constant_1 = require("../../utils/constant");
const user_1 = __importDefault(require("../../model/user"));
const instructor_1 = __importDefault(require("../../model/instructor"));
const student_1 = __importDefault(require("../../model/student"));
const profile_1 = __importDefault(require("../../model/profile"));
const mailSender_1 = __importDefault(require("../../utils/email/mailSender"));
const apiResponse_1 = require("../../utils/apiResponseHandler/apiResponse");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const generateVerificationToken = (userId) => {
    const secret = process.env.JWT_SECRET;
    const token = jsonwebtoken_1.default.sign({ userId }, secret, {
        expiresIn: "1h",
    });
    return token;
};
exports.registerUser = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Invalid email format"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
    (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { firstName, lastName, email, password, accountType } = req.body;
        // Validate required fields
        if (!firstName || !lastName || !email || !password || !accountType) {
            throw new apiError_1.ApiError({
                status: constant_1.HTTP_STATUS.BAD_REQUEST,
                message: constant_1.RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
            });
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            throw new apiError_1.ApiError({
                status: constant_1.HTTP_STATUS.BAD_REQUEST,
                message: errors.array()[0].msg,
            });
        }
        // Check if the user already exists
        const existingUser = yield user_1.default.findOne({ email });
        if (existingUser) {
            throw new apiError_1.ApiError({
                status: constant_1.HTTP_STATUS.CONFLICT,
                message: constant_1.RESPONSE_MESSAGES.USERS.EMAIL_ALREADY_IN_USE,
            });
        }
        // Encrypt the password
        const encryptedPassword = yield bcrypt_1.default.hash(password, 10);
        // Create the additional profile details
        const additionalDetails = yield profile_1.default.create({
            gender: null,
            dob: null,
            about: null,
            contactNumber: null,
        });
        let user;
        // Create the user based on the account type
        if (accountType === "Instructor") {
            user = yield instructor_1.default.create({
                firstName,
                lastName,
                email,
                password: encryptedPassword,
                accountType,
                additionalDetails,
                image: "",
                earnings: 0,
                courses: [],
            });
        }
        else if (accountType === "Student") {
            user = yield student_1.default.create({
                firstName,
                lastName,
                email,
                password: encryptedPassword,
                accountType,
                additionalDetails,
                image: "",
                enrolledCourses: [],
                courseProgress: [],
            });
        }
        else if (accountType === "Admin") {
            user = yield user_1.default.create({
                firstName,
                lastName,
                email,
                password: encryptedPassword,
                accountType,
                additionalDetails,
                image: "",
            });
        }
        else {
            throw new apiError_1.ApiError({
                status: constant_1.HTTP_STATUS.BAD_REQUEST,
                message: "Invalid account type",
            });
        }
        const verificationToken = generateVerificationToken(user._id);
        // Update the user with the verification token
        user.verificationToken = verificationToken;
        yield user.save();
        const verificationLink = `${process.env.Frontend_Production_url}/verify-email?token=${verificationToken}`;
        const templatePath = path_1.default.join(__dirname, "..", "..", "utils", "email", "templates", "verifyEmail.html");
        let emailHtml = fs_1.default.readFileSync(templatePath, "utf8");
        // Replace the placeholder with the actual verification link
        emailHtml = emailHtml.replace(/{{verificationLink}}/g, verificationLink);
        // Send the verification email
        yield (0, mailSender_1.default)(email, "Account Verification", emailHtml);
        res.status(constant_1.HTTP_STATUS.CREATED).json(new apiResponse_1.ApiResponse({
            status: constant_1.HTTP_STATUS.CREATED,
            message: constant_1.RESPONSE_MESSAGES.USERS.REGISTER,
            data: { user },
        }));
    })),
];
exports.loginUser = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Invalid email format").normalizeEmail(),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
    (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { email, password } = req.body;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            throw new apiError_1.ApiError({
                status: constant_1.HTTP_STATUS.BAD_REQUEST,
                message: errors.array()[0].msg,
            });
        }
        if (!email || !password) {
            throw new apiError_1.ApiError({
                status: constant_1.HTTP_STATUS.BAD_REQUEST,
                message: constant_1.RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
            });
        }
        let user = yield user_1.default.findOne({ email }, {
            email: 1,
            password: 1,
            _id: 1,
            accountType: 1,
            isVerified: 1,
            isActive: 1,
            image: 1,
            enrolledCourses: 1,
            courses: 1,
        });
        if (!user) {
            throw new apiError_1.ApiError({
                status: constant_1.HTTP_STATUS.NOT_FOUND,
                message: constant_1.RESPONSE_MESSAGES.USERS.NOT_FOUND,
            });
        }
        // Check if the user account is active
        if (user.isActive === false) {
            throw new apiError_1.ApiError({
                status: constant_1.HTTP_STATUS.UNAUTHORIZED,
                message: constant_1.RESPONSE_MESSAGES.USERS.UNVERIFIED_EMAIL,
            });
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            throw new apiError_1.ApiError({
                status: constant_1.HTTP_STATUS.CONFLICT,
                message: constant_1.RESPONSE_MESSAGES.USERS.INVALID_PASSWORD,
            });
        }
        const secret = process.env.JWT_SECRET;
        // Prepare token payload
        const tokenPayload = {
            email: user.email,
            id: user._id,
            role: user.accountType,
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, secret, { expiresIn: "24h" });
        const options = {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            httpOnly: true,
        };
        // Exclude the password from the user object in the response
        user.password = "";
        res
            .cookie("token", token, options)
            .status(constant_1.HTTP_STATUS.OK)
            .json(new apiResponse_1.ApiResponse({
            status: constant_1.HTTP_STATUS.OK,
            message: constant_1.RESPONSE_MESSAGES.USERS.LOGIN,
            data: { token, user },
        }));
    })),
];
exports.confirmEmail = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract token and ensure it's a string
    const token = req.query.token;
    if (!token) {
        throw new apiError_1.ApiError({
            status: 400,
            message: "Token is required.",
        });
    }
    try {
        const secret = process.env.JWT_SECRET;
        const decoded = jsonwebtoken_1.default.verify(token, secret); // Cast to expected type
        const userId = decoded.userId;
        const user = yield user_1.default.findById(userId);
        if (!user) {
            throw new apiError_1.ApiError({
                status: constant_1.HTTP_STATUS.NOT_FOUND,
                message: constant_1.RESPONSE_MESSAGES.USERS.NOT_FOUND,
            });
        }
        // Mark the user as verified
        user.isActive = true;
        // user.verificationToken = undefined;
        //Remove the verificationToken in user data
        user.verificationToken = "";
        yield user.save();
        res.status(200).json(new apiResponse_1.ApiResponse({
            status: constant_1.HTTP_STATUS.OK,
            message: constant_1.RESPONSE_MESSAGES.USERS.EMAIL_VERIFIED,
        }));
    }
    catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new apiError_1.ApiError({
                status: constant_1.HTTP_STATUS.BAD_REQUEST,
                message: constant_1.RESPONSE_MESSAGES.USERS.VERIFICATION_TOKEN_EXPIRED,
            });
        }
        else {
            throw new apiError_1.ApiError({
                status: constant_1.HTTP_STATUS.BAD_REQUEST,
                message: constant_1.RESPONSE_MESSAGES.USERS.VERIFICATION_TOKEN_EXPIRED,
            });
        }
    }
}));
exports.updateUserPassword = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const { email } = req.currentUser;
    const user = yield user_1.default.findOne({ email }, { password: 1 });
    //compare oldPassword and saved password hashed value
    if (!user || !(yield bcrypt_1.default.compare(oldPassword, user.password))) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.UNAUTHORIZED,
            message: constant_1.RESPONSE_MESSAGES.USERS.INVALID_PASSWORD,
        });
    }
    if (yield bcrypt_1.default.compare(newPassword, user.password)) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.BAD_REQUEST,
            message: constant_1.RESPONSE_MESSAGES.USERS.SAME_PASSWORD,
        });
    }
    if (newPassword !== confirmPassword) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.CONFLICT,
            message: constant_1.RESPONSE_MESSAGES.USERS.INVALID_PASSWORD,
        });
    }
    const encryptedNewPassword = yield bcrypt_1.default.hash(newPassword, 10);
    //save new hashed password
    yield user_1.default.findOneAndUpdate({ email }, { password: encryptedNewPassword });
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.USERS.PASSWORD_UPDATED,
    }));
}));
exports.sendPasswordResetEmail = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Invalid email format"),
    (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const email = req.body.email;
        if (!email) {
            throw new apiError_1.ApiError({
                status: constant_1.HTTP_STATUS.BAD_REQUEST,
                message: constant_1.RESPONSE_MESSAGES.USERS.EMAIL_NOT_FOUND,
            });
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            throw new apiError_1.ApiError({
                status: constant_1.HTTP_STATUS.BAD_REQUEST,
                message: errors.array()[0].msg,
            });
        }
        const user = yield user_1.default.findOne({ email });
        if (!user) {
            throw new apiError_1.ApiError({
                status: constant_1.HTTP_STATUS.NOT_FOUND,
                message: constant_1.RESPONSE_MESSAGES.USERS.NOT_FOUND,
            });
        }
        const verificationToken = generateVerificationToken(user._id);
        user.verificationToken = verificationToken;
        yield user.save();
        const verificationLink = `${process.env.Frontend_Production_url}/reset-password?token=${verificationToken}`;
        // Path to your email template
        const templatePath = path_1.default.join(__dirname, "..", "..", "utils", "email", "templates", "forgotPassword.html");
        let emailHtml = fs_1.default.readFileSync(templatePath, "utf8");
        // Replace all occurrences of {{verificationLink}} with the actual verification link
        emailHtml = emailHtml.replace(/{{verificationLink}}/g, verificationLink);
        yield (0, mailSender_1.default)(email, "Generate a new password", emailHtml);
        res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
            status: constant_1.HTTP_STATUS.OK,
            message: constant_1.RESPONSE_MESSAGES.USERS.EMAIL_SENT,
        }));
    })),
];
exports.resetPassword = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { newPassword, confirmPassword } = req.body;
    const token = req.query.token;
    if (!token) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.BAD_REQUEST,
            message: constant_1.RESPONSE_MESSAGES.USERS.MISSING_TOKEN,
        });
    }
    const secret = process.env.JWT_SECRET;
    const decoded = jsonwebtoken_1.default.verify(token, secret); // Cast to expected type
    const userId = decoded.userId;
    const user = yield user_1.default.findById(userId);
    if (!user) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.USERS.NOT_FOUND,
        });
    }
    if (!newPassword || !confirmPassword) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
        });
    }
    const encryptedPassword = yield bcrypt_1.default.hash(newPassword, 10);
    // delete the verification token in database of user
    user.verificationToken = "";
    //save new hashed password
    yield user_1.default.findByIdAndUpdate(user._id, {
        password: encryptedPassword,
    });
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.USERS.PASSWORD_UPDATED,
    }));
}));
exports.toggleUserActiveStatus = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, isActive } = req.body;
    if (!userId || typeof isActive !== "boolean") {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
        });
    }
    //update the active status
    const updatedUser = yield user_1.default.findByIdAndUpdate(userId, { isActive }, { new: true });
    if (!updatedUser) {
        throw new apiError_1.ApiError({
            status: 404,
            message: constant_1.RESPONSE_MESSAGES.USERS.NOT_FOUND,
        });
    }
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.USERS.USER_STATUS,
        data: { user: updatedUser },
    }));
}));
