import express from "express";
import {
  createClient,
  getAllClients,
  getClientById,
  updateClientById,
  deleteClientById,
  getClientCredits,
} from "./client.controller";
import authenticateToken from "@/core/middlewares/authenticateToken";

const clientRouter = express.Router();

clientRouter.get("/", getAllClients);
clientRouter.post("/register", createClient);
clientRouter.get("/:id", authenticateToken, getClientById);
clientRouter.get("/:id/credits", authenticateToken, getClientCredits);
clientRouter.patch("/:id", updateClientById);
clientRouter.delete("/:id", deleteClientById);

export default clientRouter;
