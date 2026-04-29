import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/error.util";
import clientRepository from "../entities/client/client.repository";

const verifyClient = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const { clientId } = req.params;

  const resource = await clientRepository.getClient({ filter: { _id: clientId, userId } });

  if (!resource) return next(new AppError(404, "Resource not found", "NOT_FOUND"));

  req.clientId = resource._id;

  next();
};

export default verifyClient;
