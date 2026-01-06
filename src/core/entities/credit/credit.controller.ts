import { Request, Response } from "express";
import creditRepository from "./credit.repository";

export const createCredit = async (req: Request, res: Response): Promise<Response> => {
  const response = await creditRepository.createCredit(req);
  return res.status(200).json(response);
};

export const getAllCredits = async (req: Request, res: Response): Promise<Response> => {
  const response = await creditRepository.getAllCredits();
  return res.status(200).json(response);
};

export const getCreditById = async (req: Request, res: Response): Promise<Response> => {
  const response = await creditRepository.getCreditById(req);
  return res.status(200).json(response);
};

export const updateCreditDetailsById = async (req: Request, res: Response): Promise<Response> => {
  const response = await creditRepository.updateCreditDetails(req);
  return res.status(200).json(response);
};

export const addSettlementToCreditById = async (req: Request, res: Response): Promise<Response> => {
  const response = await creditRepository.addCreditSettlement(req);
  return res.status(200).json(response);
};

export const deleteCreditById = async (req: Request, res: Response): Promise<Response> => {
  const response = await creditRepository.deleteCreditById(req);
  return res.status(200).json(response);
};
