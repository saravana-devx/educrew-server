import { HTTP_STATUS } from "../constant";

interface ApiResponseInterface {
    status: number;
    data?: any;
    message: string;
}

class ApiResponse {
    status: number;
    data?: any;
    message: string;
    success: boolean;

    constructor({ status, data, message = 'Success' }: ApiResponseInterface) {
        this.status = status;
        this.data = data;
        this.message = message;
        this.success = status < HTTP_STATUS.BAD_REQUEST;
    }
}

export { ApiResponse };