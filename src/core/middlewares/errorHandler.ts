import { Request, Response, NextFunction } from "express";
import { AppError, FieldError, FieldErrors } from "../utils/error.util";

export const ErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction): void => {
  let status = 500;
  let code = "UNEXPECTED_ERROR";
  let message = "Unexpected Server Error";
  let fieldErrors: FieldErrors | undefined = undefined;

  if (err instanceof AppError || err instanceof FieldError) {
    if (err instanceof FieldError) fieldErrors = err.fieldErrors;

    status = err.status;
    message = err.message;
    code = err.code;
  }

  res.status(status).json({ message, code, ...(fieldErrors !== undefined && { fieldErrors }) });
};
