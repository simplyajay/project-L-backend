import { Request, Response, NextFunction } from "express";
import { AppError, FieldError } from "../utils/error.util";

export const ErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction): void => {
  let status = 500;
  let code = "UNEXPECTED_ERROR";
  let message = "Unexpected Server Error";
  let keyValue = undefined;

  if (err instanceof AppError || err instanceof FieldError) {
    if (err instanceof FieldError) keyValue = err.keyValue;

    status = err.status;
    message = err.message;
    code = err.code;
  }

  console.log(err);

  res.status(status).json({ message, code, ...(keyValue !== undefined && { keyValue }) });
};
