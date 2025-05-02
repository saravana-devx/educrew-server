import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiResponseHandler/apiError";
import { HTTP_STATUS, RESPONSE_MESSAGES } from "../utils/constant";

const errorMiddleware = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = {
    status: err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: err.message || RESPONSE_MESSAGES.COMMON.INTERNAL_SERVER_ERROR,
    errors: err.errors && err.errors.length > 0 ? err.errors : undefined,
  };

  res.status(response.status).json(response);
  next();
};

export default errorMiddleware;
