import { Request, response, Response } from "express";
import { handleLogin, handleLogout } from "./auth.service";

export const authorizeLogin = async (req: Request, res: Response): Promise<Response> => {
  const response = await handleLogin(req);
  return res.status(200).json(response);
};

export const authorizeLogout = async (req: Request, res: Response): Promise<Response> => {
  const reponse = await handleLogout(req);
  return res.status(200).json(response);
};
