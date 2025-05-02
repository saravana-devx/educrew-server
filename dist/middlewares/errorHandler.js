"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constant_1 = require("../utils/constant");
const errorMiddleware = (err, req, res, next) => {
    const response = {
        status: err.status || constant_1.HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: err.message || constant_1.RESPONSE_MESSAGES.COMMON.INTERNAL_SERVER_ERROR,
        errors: err.errors && err.errors.length > 0 ? err.errors : undefined,
    };
    res.status(response.status).json(response);
    next();
};
exports.default = errorMiddleware;
