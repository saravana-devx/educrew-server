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
exports.stripeWebhook = exports.createCheckOutSession = void 0;
const asyncHandler_1 = __importDefault(require("../../middlewares/asyncHandler"));
const apiError_1 = require("../../utils/apiResponseHandler/apiError");
const apiResponse_1 = require("../../utils/apiResponseHandler/apiResponse");
const constant_1 = require("../../utils/constant");
const mailSender_1 = __importDefault(require("../../utils/email/mailSender"));
const student_1 = __importDefault(require("../../model/student"));
const course_1 = __importDefault(require("../../model/course"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const stripe_1 = __importDefault(require("stripe"));
const instructor_1 = __importDefault(require("../../model/instructor"));
const createCheckOutSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseId } = req.params;
    const userId = req.currentUser.id;
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!courseId) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.BAD_REQUEST,
            message: constant_1.RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
        });
    }
    const course = yield course_1.default.findById(courseId);
    if (!course) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COURSES.NOT_FOUND,
        });
    }
    const student = yield student_1.default.findById(userId);
    if (!student) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.USERS.NOT_FOUND,
        });
    }
    if (student.enrolledCourses.length < 0) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.FORBIDDEN,
            message: constant_1.RESPONSE_MESSAGES.ENROLLMENTS.ALREADY_ENROLLED,
        });
    }
    if (!secretKey) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.FORBIDDEN,
            message: constant_1.RESPONSE_MESSAGES.PAYMENT.KEY_NOT_FOUND,
        });
    }
    const stripe = new stripe_1.default(secretKey);
    const session = yield stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        success_url: `${process.env.Frontend_Production_url}/payment-success`,
        cancel_url: `${process.env.Frontend_Production_url}/payment-cancel`,
        metadata: {
            courseId: courseId,
            userId: userId,
        },
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: course.courseName,
                    },
                    unit_amount: course.price * 100,
                },
                quantity: 1,
            },
        ],
    });
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: "Checkout session created successfully",
        data: { id: session.id },
    }));
});
exports.createCheckOutSession = createCheckOutSession;
const purchaseCourseOperation = (userId, courseId) => __awaiter(void 0, void 0, void 0, function* () {
    const student = yield student_1.default.findById(userId);
    const course = yield course_1.default.findById(courseId);
    if (!student) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.USERS.NOT_FOUND,
        });
    }
    if (!course) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
        });
    }
    yield student_1.default.findByIdAndUpdate(userId, {
        $push: { enrolledCourses: courseId },
    }, { new: true });
    // add student id in studentEnrolled array in course
    yield course_1.default.findByIdAndUpdate(courseId, {
        $push: {
            studentEnrolled: userId,
        },
    }, { new: true });
    yield instructor_1.default.findByIdAndUpdate(course.instructor, {
        $inc: {
            earnings: course.price,
        },
    }, { new: true });
    const templatePath = path_1.default.join(__dirname, "..", "..", "utils", "email", "templates", "purchasedCourse.html");
    let emailHtml = fs_1.default.readFileSync(templatePath, "utf8");
    emailHtml = emailHtml.replace(/{{courseName}}/g, course.courseName);
    yield (0, mailSender_1.default)(student.email, "Course Purchase Confirmation", emailHtml);
});
exports.stripeWebhook = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const sig = req.headers["stripe-signature"];
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secretKey || !endpointSecret) {
        return res.status(403).send("Stripe secret keys missing");
    }
    const stripe = new stripe_1.default(secretKey);
    let event;
    try {
        // Pass raw request body directly
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
    catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const courseId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.courseId;
        const userId = (_b = session.metadata) === null || _b === void 0 ? void 0 : _b.userId;
        if (!courseId || !userId) {
            return res.status(400).send("Missing metadata");
        }
        yield purchaseCourseOperation(userId, courseId);
    }
    res.status(200).send("Webhook received");
}));
