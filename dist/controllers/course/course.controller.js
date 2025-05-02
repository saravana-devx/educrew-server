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
exports.deleteCourseByAdmin = exports.deleteCourseByInstructor = exports.updateCourseStatus = exports.getCourseByUser = exports.getPagination = exports.getAllCourses = exports.getCourseById = exports.editCourse = exports.createCourse = void 0;
const asyncHandler_1 = __importDefault(require("../../middlewares/asyncHandler"));
const apiError_1 = require("../../utils/apiResponseHandler/apiError");
const apiResponse_1 = require("../../utils/apiResponseHandler/apiResponse");
const constant_1 = require("../../utils/constant");
const uploadMediaToCloudinary_1 = __importDefault(require("../../utils/cloudinary/uploadMediaToCloudinary"));
const user_1 = __importDefault(require("../../model/user"));
const course_1 = __importDefault(require("../../model/course"));
const section_1 = __importDefault(require("../../model/section"));
const subSection_1 = __importDefault(require("../../model/subSection"));
const ratingAndReview_1 = __importDefault(require("../../model/ratingAndReview"));
const student_1 = __importDefault(require("../../model/student"));
const instructor_1 = __importDefault(require("../../model/instructor"));
exports.createCourse = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseName, description, price, status, category } = req.body;
    let { whatYouWillLearn } = req.body;
    const { id } = req.currentUser;
    // Convert stringified array if it comes as a string
    if (typeof whatYouWillLearn === "string") {
        try {
            whatYouWillLearn = JSON.parse(whatYouWillLearn);
        }
        catch (err) {
            throw new apiError_1.ApiError({
                status: constant_1.HTTP_STATUS.BAD_REQUEST,
                message: "Invalid format for whatYouWillLearn",
            });
        }
    }
    // Validate it's actually an array
    if (!Array.isArray(whatYouWillLearn) || whatYouWillLearn.length === 0) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
        });
    }
    const instructor = yield instructor_1.default.findById(id);
    if (!instructor) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.USERS.NOT_FOUND,
        });
    }
    if (!courseName ||
        !description ||
        !price ||
        !whatYouWillLearn ||
        !category) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
        });
    }
    if (!req.file) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
        });
    }
    const response = yield (0, uploadMediaToCloudinary_1.default)(req.file.path);
    const thumbnailUrl = response.secure_url;
    const course = yield course_1.default.create({
        courseName,
        instructor: id,
        description,
        thumbnail: thumbnailUrl,
        price,
        whatYouWillLearn,
        category,
        status,
        content: [],
    });
    instructor.courses.push(course._id);
    yield instructor.save();
    res.status(constant_1.HTTP_STATUS.CREATED).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.CREATED,
        message: constant_1.RESPONSE_MESSAGES.COURSES.CREATED,
        data: { course },
    }));
}));
exports.editCourse = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseId } = req.params;
    const { courseName, description, price, status, category } = req.body;
    const whatYouWillLearn = JSON.parse(req.body.whatYouWillLearn);
    const course = yield course_1.default.findById(courseId);
    if (!course) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COURSES.NOT_FOUND,
        });
    }
    let thumbnailUrl;
    if (req.file) {
        const response = yield (0, uploadMediaToCloudinary_1.default)(req.file.path);
        thumbnailUrl = response.secure_url;
    }
    const editedCourse = yield course_1.default.findByIdAndUpdate(courseId, Object.assign({ courseName,
        description,
        price,
        whatYouWillLearn,
        status,
        category }, (thumbnailUrl && { thumbnail: thumbnailUrl })), { new: true });
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.COURSES.UPDATED,
        data: { editedCourse },
    }));
}));
exports.getCourseById = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const course = yield course_1.default.findById(id)
        .populate({
        path: "instructor",
        model: "User",
        select: "firstName lastName image",
    })
        .populate({
        path: "content",
        model: "Section",
        populate: { path: "subSection", model: "SubSection" },
    })
        .populate({
        path: "ratingAndReview",
        populate: {
            path: "user",
            model: "User",
            select: "firstName lastName image",
        },
    });
    if (!course) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COURSES.NOT_FOUND,
        });
    }
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.COURSES.FOUND,
        data: { course },
    }));
}));
exports.getAllCourses = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const courses = yield course_1.default.find({ status: "Published" }).populate({
        path: "instructor",
        model: "User",
        select: "firstName lastName image",
    });
    if (!courses) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COURSES.NOT_FOUND,
        });
    }
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.COURSES.FOUND,
        data: { courses },
    }));
}));
exports.getPagination = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    if (isNaN(page) || isNaN(limit)) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.CONFLICT,
            message: "Invalid page or limit value",
        });
    }
    //To eliminate previous page courses
    const startIndex = (page - 1) * limit;
    const courses = yield course_1.default.find()
        .populate({
        path: "instructor",
        model: "User",
        select: "firstName lastName image",
    })
        .limit(limit)
        .skip(startIndex)
        .exec();
    const totalCourses = yield course_1.default.countDocuments().exec();
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: `Displaying page ${page} with a limit of ${limit} courses per page.`,
        data: {
            courses,
            totalCourses,
        },
    }));
}));
exports.getCourseByUser = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.currentUser;
    const user = yield student_1.default.findById(id).populate({
        path: "enrolledCourses",
        model: "Course",
        select: "courseName instructor thumbnail description",
        populate: {
            path: "instructor",
            model: "User",
            select: "firstName lastName image",
        },
    });
    if (!user) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COURSES.USER_COURSES_NOT_FOUND,
        });
    }
    const courses = user.enrolledCourses;
    //if enrolledCourses is empty respond with not found message
    if (courses.length === 0) {
        return res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
            status: constant_1.HTTP_STATUS.OK,
            message: constant_1.RESPONSE_MESSAGES.COURSES.USER_NOT_ENROLLED,
        }));
    }
    // Respond with the found courses
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.COURSES.USER_COURSES_FOUND,
        data: { courses },
    }));
}));
exports.updateCourseStatus = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.courseId;
    const newStatus = req.body.status;
    const course = yield course_1.default.findByIdAndUpdate(id, { $set: { status: newStatus } }, { new: true });
    if (!course) {
        return res.status(constant_1.HTTP_STATUS.NOT_FOUND).json(new apiResponse_1.ApiResponse({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COURSES.NOT_FOUND,
        }));
    }
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.COURSES.COURSE_STATUS_UPDATED,
        data: course,
    }));
}));
exports.deleteCourseByInstructor = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseId } = req.params;
    const course = yield course_1.default.findByIdAndDelete(courseId);
    if (!course) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COURSES.NOT_FOUND,
        });
    }
    yield section_1.default.deleteMany({ courseId });
    yield subSection_1.default.deleteMany({ courseId });
    yield ratingAndReview_1.default.deleteMany({ courseId });
    yield user_1.default.updateMany({ courses: courseId }, { $pull: { courses: courseId } });
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.COURSES.DELETED,
    }));
}));
exports.deleteCourseByAdmin = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseId } = req.params;
    const course = yield course_1.default.findByIdAndDelete(courseId);
    if (!course) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COURSES.NOT_FOUND,
        });
    }
    yield section_1.default.deleteMany({ courseId });
    yield subSection_1.default.deleteMany({ courseId });
    yield ratingAndReview_1.default.deleteMany({ courseId });
    yield user_1.default.updateMany({ courses: courseId }, { $pull: { courses: courseId } });
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.COURSES.DELETED,
    }));
}));
