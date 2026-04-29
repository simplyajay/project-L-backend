import { Request, Response, NextFunction } from "express";
import { JWTPayload } from "../entities/auth/auth";
import { AppError } from "../utils/error.util";
import env from "@/config/env";
import jwt from "jsonwebtoken";

const secret = env.get("ACCESS_TOKEN_SECRET");

const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  if (!secret) return next(new AppError(401, "Unauthorized: No token provided", "UNAUTHORIZED"));

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError(401, "Unauthorized: No token provided", "UNAUTHORIZED"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, secret) as unknown;
    req.user = decoded as JWTPayload;
    next();
  } catch {
    return next(new AppError(401, "Unauthorized: No token provided", "UNAUTHORIZED"));
  }
};

export default authenticate;
