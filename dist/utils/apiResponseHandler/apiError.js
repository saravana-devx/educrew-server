"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    constructor({ status, message, errors = [], stack = "" }) {
        super(message);
        this.status = status;
        this.message = message;
        this.success = false;
        this.errors = errors.length > 0 ? errors : undefined;
        if (stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.ApiError = ApiError;
