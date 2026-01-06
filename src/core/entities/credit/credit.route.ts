import express from "express";
import {
  createCredit,
  getAllCredits,
  getCreditById,
  updateCreditDetailsById,
  addSettlementToCreditById,
  deleteCreditById,
} from "./credit.controller";

const creditRouter = express.Router();

creditRouter.get("/", getAllCredits);
creditRouter.post("/register", createCredit);
creditRouter.get("/:id", getCreditById);
creditRouter.patch("/:id", updateCreditDetailsById);
creditRouter.patch("/:id/new-payment", addSettlementToCreditById);
creditRouter.delete("/:id", deleteCreditById);

export default creditRouter;
