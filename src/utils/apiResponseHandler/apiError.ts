interface ApiErrorInterface {
  status: number;
  message: string;
  errors?: string[];
  stack?: string;
}

class ApiError extends Error {
  status: number;
  data: any;
  message: string;
  success: boolean;
  errors?: string[];

  constructor({ status, message, errors = [], stack = "" }: ApiErrorInterface) {
    super(message);
    this.status = status;
    this.message = message;
    this.success = false;
    this.errors = errors.length > 0 ? errors : undefined;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
