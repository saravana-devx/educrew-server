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
exports.deleteSubSection = exports.updateSubSection = exports.addSubSection = void 0;
const asyncHandler_1 = __importDefault(require("../../../middlewares/asyncHandler"));
const apiError_1 = require("../../../utils/apiResponseHandler/apiError");
const constant_1 = require("../../../utils/constant");
const section_1 = __importDefault(require("../../../model/section"));
const uploadMediaToCloudinary_1 = __importDefault(require("../../../utils/cloudinary/uploadMediaToCloudinary"));
const subSection_1 = __importDefault(require("../../../model/subSection"));
const apiResponse_1 = require("../../../utils/apiResponseHandler/apiResponse");
exports.addSubSection = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sectionId } = req.params;
    const { title, description } = req.body;
    if (!title || !description) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.BAD_REQUEST,
            message: constant_1.RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
        });
    }
    if (!req.file) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.BAD_REQUEST,
            message: constant_1.RESPONSE_MESSAGES.COMMON.VIDEO_NOT_FOUND,
        });
    }
    const section = yield section_1.default.findById(sectionId);
    if (!section) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.SECTIONS.NOT_FOUND,
        });
    }
    //extract video url as response from cloudinary
    const response = yield (0, uploadMediaToCloudinary_1.default)(req.file.path);
    const subSection = yield subSection_1.default.create({
        title,
        timeDuration: response.duration,
        description,
        video: response.secure_url,
    });
    //add subSection ID to section by sectionId
    const updatedSection = yield section_1.default.findByIdAndUpdate(sectionId, {
        $push: { subSection: subSection._id },
    }, { new: true });
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.SUBSECTIONS.CREATED,
        data: { updatedSection, subSection },
    }));
}));
exports.updateSubSection = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sectionId, subSectionId } = req.params;
    const { title, description } = req.body;
    if (!sectionId || !subSectionId) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.BAD_REQUEST,
            message: constant_1.RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
        });
    }
    const subSection = yield subSection_1.default.findById(subSectionId);
    if (!subSection) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.SUBSECTIONS.NOT_FOUND,
        });
    }
    let response = {};
    if (req.file) {
        response = yield (0, uploadMediaToCloudinary_1.default)(req.file.path);
    }
    const updatedSubSection = yield subSection_1.default.findByIdAndUpdate(subSectionId, {
        title,
        description,
        video: response.secure_url,
        timeDuration: response.duration,
    }, { new: true });
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.SUBSECTIONS.UPDATED,
        data: { updatedSubSection },
    }));
}));
exports.deleteSubSection = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sectionId, subSectionId } = req.params;
    if (!sectionId || !subSectionId) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.BAD_REQUEST,
            message: constant_1.RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
        });
    }
    const section = yield section_1.default.findById(sectionId);
    if (!section) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.SECTIONS.NOT_FOUND,
        });
    }
    //remove subSection id from section-> subSection array
    yield section_1.default.updateOne({ _id: sectionId }, { $pull: { subSection: subSectionId } });
    const deletedSubSection = yield subSection_1.default.findByIdAndDelete(subSectionId);
    res.status(constant_1.HTTP_STATUS.OK).json(new apiResponse_1.ApiResponse({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.SUBSECTIONS.DELETED,
        data: { deletedSubSection },
    }));
}));
