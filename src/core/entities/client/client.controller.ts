import { Request, Response } from "express";
import clientRepository from "./client.repository";

export const createClient = async (req: Request, res: Response): Promise<Response> => {
  const response = await clientRepository.createClient(req);
  return res.status(200).json(response);
};

export const getAllClients = async (req: Request, res: Response): Promise<Response> => {
  const response = await clientRepository.getAllClients();
  return res.status(200).json(response);
};

export const getClientById = async (req: Request, res: Response): Promise<Response> => {
  const response = await clientRepository.getClientById(req);
  return res.status(200).json(response);
};

export const getClientCredits = async (req: Request, res: Response): Promise<Response> => {
  const response = await clientRepository.getClientCredits(req);
  return res.status(200).json(response);
};

export const updateClientById = async (req: Request, res: Response): Promise<Response> => {
  const response = await clientRepository.updateClientById(req);
  return res.status(200).json(response);
};

export const deleteClientById = async (req: Request, res: Response): Promise<Response> => {
  const response = await clientRepository.deleteClientById(req);
  return res.status(200).json(response);
};
