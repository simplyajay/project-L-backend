import express from "express";
import authenticate from "@/core/middlewares/authentication";
import * as MyController from "./controller/user.me.controller";
import * as AdminController from "./controller/user.admin.controller";
import * as PublicController from "./controller/user.public.controller";
import { getAllByUser } from "../client/controller/client.admin.controller";
import authorize from "@/core/middlewares/authorization";
import { validateSchema } from "@/core/middlewares/validation";
import { AddUserSchema, DeleteMeSchema, UpdatePasswordSchema, UpdateUserSchema } from "./user";

const userMeRouter = express.Router();
const userAdminRouter = express.Router();
const userPublicRouter = express.Router();

//public
userPublicRouter.post("/", validateSchema(AddUserSchema), PublicController.register);

//user
userMeRouter.patch(
  "/update/information",
  authenticate,
  validateSchema(UpdateUserSchema),
  MyController.updateMyPersonalInformation,
);
userMeRouter.patch(
  "/update/password",
  authenticate,
  validateSchema(UpdatePasswordSchema),
  MyController.updateMyPassword,
);
userMeRouter.post("/delete", authenticate, validateSchema(DeleteMeSchema), MyController.deleteMe);

//admin
userAdminRouter.get("/", authenticate, authorize("admin"), AdminController.getAll);
userAdminRouter.get("/:id", authenticate, authorize("admin"), AdminController.getOne);
userAdminRouter.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  validateSchema(UpdateUserSchema),
  AdminController.updateOne,
);
userAdminRouter.delete("/:id", authenticate, authorize("admin"), AdminController.deleteOne);
userAdminRouter.get("/:id/clients", authenticate, authorize("admin"), getAllByUser);

export { userMeRouter, userAdminRouter, userPublicRouter };
