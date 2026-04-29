import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/error.util";

const authorize =
  (...allowedRules: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) return next(new AppError(401, "Unauthorized: Invalid session", "UNAUTHORIZED"));

    if (!allowedRules.includes(user.role)) return next(new AppError(403, "Forbidden: No permission", "FORBIDDEN"));

    next();
  };

export default authorize;
