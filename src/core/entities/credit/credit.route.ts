import express from "express";
import * as AdminController from "./controller/credit.admin.controller";
import { validateSchema } from "@/core/middlewares/validation";
import { AdminUpdateCreditSchema } from "./credit";
import authenticate from "@/core/middlewares/authentication";
import authorize from "@/core/middlewares/authorization";

const adminCreditRouter = express.Router();

adminCreditRouter.get("/", authenticate, authorize("admin"), AdminController.getAll);
adminCreditRouter.get("/:id", authenticate, authorize("admin"), AdminController.getOne);
adminCreditRouter.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  validateSchema(AdminUpdateCreditSchema),
  AdminController.updateOne,
);
adminCreditRouter.delete("/:id", authenticate, authorize("admin"), AdminController.deleteOne);

export { adminCreditRouter };
