"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQuery = exports.postQuery = void 0;
const asyncHandler_1 = __importDefault(require("../../middlewares/asyncHandler"));
const apiError_1 = require("../../utils/apiResponseHandler/apiError");
const constant_1 = require("../../utils/constant");
const contact_1 = __importDefault(require("../../model/contact"));
exports.postQuery = (0, asyncHandler_1.default)(async (req, res) => {
    const { firstName, lastName, email, phone, message } = req.body;
    if (!firstName || !lastName || !email || !phone || !message) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.BAD_REQUEST,
            message: constant_1.RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
        });
    }
    const newQuery = await contact_1.default.create({
        firstName,
        lastName,
        email,
        phone,
        message,
    });
    res.status(constant_1.HTTP_STATUS.CREATED).json({
        status: constant_1.HTTP_STATUS.CREATED,
        message: constant_1.RESPONSE_MESSAGES.CONTACT.QUERY_SENT,
        data: newQuery,
    });
});
exports.deleteQuery = (0, asyncHandler_1.default)(async (req, res) => {
    const { queryId } = req.params;
    if (!queryId) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.BAD_REQUEST,
            message: constant_1.RESPONSE_MESSAGES.COMMON.REQUIRED_FIELDS,
        });
    }
    const deletedQuery = await contact_1.default.findByIdAndDelete(queryId);
    if (!deletedQuery) {
        throw new apiError_1.ApiError({
            status: constant_1.HTTP_STATUS.NOT_FOUND,
            message: constant_1.RESPONSE_MESSAGES.CONTACT.NOT_FOUND,
        });
    }
    res.status(constant_1.HTTP_STATUS.OK).json({
        status: constant_1.HTTP_STATUS.OK,
        message: constant_1.RESPONSE_MESSAGES.CONTACT.QUERY_DELETED,
    });
});
