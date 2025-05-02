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
exports.deleteSection = exports.updateSection = exports.addSection = void 0;
const asyncHandler_1 = __importDefault(require("../../../middlewares/asyncHandler"));
const apiError_1 = require("../../../utils/apiResponseHandler/apiError");
const apiResponse_1 = require("../../../utils/apiResponseHandler/apiResponse");
const constant_1 = require("../../../utils/constant");
const course_1 = __importDefault(require("../../../model/course"));
const section_1 = __importDefault(require("../../../model/section"));
const subSection_1 = __importDefault(require("../../../model/subSection"));
exports.addSection = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseId } = req.params;
    const { sectionName } = req.body;
    if (!courseId || !sectionName) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
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
    const section = yield section_1.default.create({ sectionName });
    //add section Id in course content array
    const updatedCourse = yield course_1.default.findByIdAndUpdate(courseId, {
        $push: {
            content: section._id,
        },
    }, { new: true });
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.SECTIONS.CREATED,
        data: { section, updatedCourse },
    }));
}));
exports.updateSection = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseId, sectionId } = req.params;
    const { sectionName } = req.body;
    if (!courseId) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
        });
    }
    const updatedSection = yield section_1.default.findByIdAndUpdate(sectionId, { sectionName }, { new: true });
    if (!updatedSection) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.SECTIONS.NOT_FOUND,
        });
    }
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.SECTIONS.UPDATED,
        data: { updatedSection },
    }));
}));
exports.deleteSection = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseId, sectionId } = req.params;
    if (!courseId || !sectionId) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
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
    const section = yield section_1.default.findById(sectionId);
    if (!section) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.SECTIONS.FOUND,
        });
    }
    yield subSection_1.default.deleteMany({ _id: { $in: section.subSection } });
    yield section_1.default.findByIdAndDelete(sectionId);
    yield course_1.default.findByIdAndUpdate(courseId, {
        $pull: { content: sectionId },
    });
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.SECTIONS.DELETED,
        data: { section },
    }));
}));
