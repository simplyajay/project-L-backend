import { Request, Response } from "express";
import userRepository from "./user.repository";

export const createUser = async (req: Request, res: Response): Promise<Response> => {
  const response = await userRepository.createUser(req);
  return res.status(200).json(response);
};

export const getAllUsers = async (req: Request, res: Response): Promise<Response> => {
  const response = await userRepository.getAllUsers();
  return res.status(200).json(response);
};

export const getUserById = async (req: Request, res: Response): Promise<Response> => {
  const response = await userRepository.getUserById(req);
  return res.status(200).json(response);
};

export const getUserClients = async (req: Request, res: Response): Promise<Response> => {
  const response = await userRepository.getUserSummarizedClients(req);
  return res.status(200).json(response);
};

export const updateUserById = async (req: Request, res: Response): Promise<Response> => {
  const response = await userRepository.updateUserById(req);
  return res.status(200).json(response);
};

export const deleteUserById = async (req: Request, res: Response): Promise<Response> => {
  const response = await userRepository.deleteUserById(req);
  return res.status(200).json(response);
};
