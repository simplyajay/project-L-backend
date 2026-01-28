import * as express from "express";
import { JWTPayload } from "../entities/auth/auth";
import { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user: JWTPayload;
      clientId: Types.ObjectId;
    }
  }
}
