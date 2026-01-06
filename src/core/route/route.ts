import { Express } from "express";
import authRouter from "../entities/auth/auth.route";
import userRouter from "../entities/user/user.route";
import clientRouter from "../entities/client/client.route";
import creditRouter from "../entities/credit/credit.route";
import { ErrorHandler } from "../middlewares/errorHandler";

export default (app: Express) => {
  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/clients", clientRouter);
  app.use("/api/credits", creditRouter);
  app.get("/", (req, res) => res.send("Hello from backend!"));

  app.use((req, res) => {
    res.status(404).json({ message: "Route not found", code: "NOT_FOUND" });
  });

  app.use(ErrorHandler);
};
