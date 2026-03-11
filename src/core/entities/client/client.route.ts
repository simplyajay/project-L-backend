import express from "express";
import authenticate from "@/core/middlewares/authentication";
import authorize from "@/core/middlewares/authorization";
import * as AdminClientController from "./controller/client.admin.controller";
import * as MyClientController from "./controller/client.me.controller";
import * as MyCreditController from "../credit/controller/credit.me.controller";
import verifyClient from "@/core/middlewares/verification";
import { AddCreditSchema, AddSettlementSchema, updateCreditSchema } from "../credit/credit";
import { validateSchema } from "@/core/middlewares/validation";
import { AdminUpdateClientSchema, CreateClientSchema, DeleteClientSchema, UpdateClientSchema } from "./client";

const clientUserRouter = express.Router();
const clientAdminRouter = express.Router();

//user routes
clientUserRouter.post("/", authenticate, validateSchema(CreateClientSchema), MyClientController.create); //add client to user
clientUserRouter.get("/", authenticate, MyClientController.getAll); // get all clients summarized
clientUserRouter.get("/:id", authenticate, MyClientController.getOne); // get specific client owned by user
clientUserRouter.patch("/:id", authenticate, validateSchema(UpdateClientSchema), MyClientController.updateOne); // update specific client owned by user
clientUserRouter.post("/:id/delete", authenticate, validateSchema(DeleteClientSchema), MyClientController.deleteOne); // delete specific client ownded by user

clientUserRouter.post(
  "/:clientId/credits",
  authenticate,
  verifyClient,
  validateSchema(AddCreditSchema),
  MyCreditController.create,
); // add credit to specific client
clientUserRouter.get("/:clientId/credits", authenticate, verifyClient, MyCreditController.getAll); // get specific client's credits
clientUserRouter.get("/:clientId/credits/:creditId", authenticate, verifyClient, MyCreditController.getOne); // get specific client's specific credit
clientUserRouter.patch(
  "/:clientId/credits/:creditId",
  authenticate,
  verifyClient,
  validateSchema(updateCreditSchema),
  MyCreditController.updateOne,
); // update specific client's specific credit
clientUserRouter.delete("/:clientId/credits/:creditId", authenticate, verifyClient, MyCreditController.deleteOne); // delete specific client's specific credit
clientUserRouter.patch(
  "/:clientId/credits/:creditId/settlements",
  authenticate,
  verifyClient,
  validateSchema(AddSettlementSchema),
  MyCreditController.addSettlement,
); // add settlement to specific client's specific credit

//admin routes
clientAdminRouter.get("/", authenticate, authorize("admin"), AdminClientController.getAll); // get all clients
clientAdminRouter.get("/:id", authenticate, authorize("admin"), AdminClientController.getOne); // get specific client
clientAdminRouter.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  validateSchema(AdminUpdateClientSchema),
  AdminClientController.updateOne,
); // update specific client
clientAdminRouter.delete("/:id", authenticate, authorize("admin"), AdminClientController.deleteOne); // delete specific client

export { clientUserRouter, clientAdminRouter };
