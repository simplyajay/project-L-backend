import express from "express";
import { authorizeLogin, authorizeLogout } from "./controller/auth.me.controller";

const authRouter = express.Router();

authRouter.post("/login", authorizeLogin);

export default authRouter;
