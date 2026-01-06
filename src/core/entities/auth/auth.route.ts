import express from "express";
import { authorizeLogin, authorizeLogout } from "./auth.controller";

const authRouter = express.Router();

authRouter.post("/login", authorizeLogin);

export default authRouter;
