import jwt from "jsonwebtoken";
import env from "@/config/env";
import { nanoid } from "nanoid";
import { AppError } from "@/core/utils/error.util";
import { UserDTOType } from "../user/user";
import { Types } from "mongoose";

export type LoginCredentials = {
  identifier: string;
  loginPassword: string;
};

export type JWTPayload = {
  id: Types.ObjectId;
  sessionId: string;
  loggedInAt: number;
  email: string;
  role: "admin" | "user";
};

export const generateAccessToken = (user: UserDTOType, role: "admin" | "user"): string => {
  try {
    const secret = env.get("ACCESS_TOKEN_SECRET");
    const ACCESS_TOKEN_EXPIRY = "30m";

    if (!secret) throw new AppError(404, "Invalid Access Token", "NOT_FOUND");

    const sessionId = nanoid(64);
    const loginTime = Date.now();

    const payload: JWTPayload = {
      id: user._id,
      sessionId,
      loggedInAt: loginTime,
      email: user.email,
      role,
    };
    const accessToken = jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_EXPIRY });
    //set redis session here. use the userId as the key and sessionId and loginTime as its value

    return accessToken;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, "Unauthorized: Token Expired", "INVALID_TOKEN");
    }

    throw error;
  }
};
