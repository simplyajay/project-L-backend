import { Express } from "express";
import { ErrorHandler } from "../middlewares/errorHandler";
import { adminCreditRouter } from "../entities/credit/credit.route";
import { clientUserRouter, clientAdminRouter } from "../entities/client/client.route";
import { userMeRouter, userPublicRouter, userAdminRouter } from "../entities/user/user.route";
import authRouter from "../entities/auth/auth.route";

export default (app: Express) => {
  //------public routes -----//
  app.get("/", (req, res) => res.send("Hello from backend!"));
  app.use("/api/user", userPublicRouter);
  app.use("/api/auth", authRouter);

  //----- user routes ------//
  app.use("/api/me", userMeRouter);
  app.use("/api/me/clients", clientUserRouter);

  //-----admin routes ------//
  app.use("/api/admin/users", userAdminRouter);
  app.use("/api/admin/clients", clientAdminRouter);
  app.use("/api/admin/credits", adminCreditRouter);

  app.use((req, res) => {
    res.status(404).json({ message: "Route not found", code: "NOT_FOUND" });
  });

  app.use(ErrorHandler);
};
