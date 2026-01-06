import * as express from "express";
import { IJwtPayload } from "../entities/auth/auth";

declare global {
  namespace Express {
    interface Request {
      user?: IJwtPayload;
    }
  }
}
