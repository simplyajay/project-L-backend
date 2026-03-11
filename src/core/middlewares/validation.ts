import { FieldError, FieldErrors } from "../utils/error.util";
import { Request, Response, NextFunction } from "express";
import { ZodObject } from "zod";

export const validateSchema = (schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
  const parseResult = schema.safeParse(req.body);

  if (!parseResult.success) {
    const errorFields: FieldErrors = parseResult.error.issues.reduce<FieldErrors>((acc, issue) => {
      const key = issue.path.join(".");

      if (!acc[key]) acc[key] = [];

      acc[key].push(issue.message);

      return acc;
    }, {});

    return next(new FieldError(400, `Invalid Request Body`, "BAD_REQUEST", errorFields));
  }

  req.body = parseResult.data;
  next();
};
