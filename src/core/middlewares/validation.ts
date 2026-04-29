import { AppError } from "../utils/error.util";
import { Request, Response, NextFunction } from "express";
import { ZodObject } from "zod";

export const validateSchema = (schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
  const parseResult = schema.safeParse(req.body);

  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((i) => `${i.path.join(".")} - ${i.message}`).join("; ");
    return next(new AppError(400, `Invalid Request Body ${issues}`, "BAD_REQUEST"));
  }

  req.body = parseResult.data;
  next();
};
