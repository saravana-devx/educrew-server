"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
const constant_1 = require("../constant");
class ApiResponse {
    constructor({ status, data, message = 'Success' }) {
        this.status = status;
        this.data = data;
        this.message = message;
        this.success = status < constant_1.HTTP_STATUS.BAD_REQUEST;
    }
}
exports.ApiResponse = ApiResponse;
