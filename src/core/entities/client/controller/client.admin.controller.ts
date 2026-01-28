import { Request, Response } from "express";
import { AdminUpdateClientPayload, ClientType } from "../client";
import { PhoneSchema } from "../../user/user";
import { AppError } from "@/core/utils/error.util";
import mongoose, { Types } from "mongoose";
import clientRepository from "../client.repository";
import creditRepository from "../../credit/credit.repository";

export const getAll = async (req: Request, res: Response): Promise<Response> => {
  const response = await clientRepository.getAllClients();
  return res.status(200).json(response);
};

export const getAllByUser = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const response = await clientRepository.getAllClients({ filter: { userId: id } });

  return res.status(200).json(response);
};

export const getOne = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const response = await clientRepository.getClient({ filter: { _id: id } });
  return res.status(200).json(response);
};

export const updateOne = async (req: Request<any, any, AdminUpdateClientPayload>, res: Response) => {
  const { id } = req.params;
  const { phone, otherPhones, userId, ...data } = req.body;

  const primaryPhone = PhoneSchema.parse(phone);

  const others = otherPhones?.map((phone) => PhoneSchema.parse(phone));

  const clientData: Partial<ClientType> = {
    ...data,
    userId: new Types.ObjectId(userId),
    ...(primaryPhone && { phone: primaryPhone }),
    ...(others && { otherPhones: others }),
  };

  const response = await clientRepository.updateClient({
    filter: { _id: id },
    data: { $set: clientData },
  });

  return res.status(200).json(response);
};

export const deleteOne = async (req: Request, res: Response) => {
  const { id } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deletedClient = await clientRepository.deleteClient({ filter: { _id: id }, options: { session } });

    if (!deletedClient) throw new AppError(404, "Client not Found", "NOT_FOUND");

    const deletedClientCredits = await creditRepository.deleteAllCredits({
      filter: { clientId: deletedClient._id },
      options: { session },
    });

    if (!deletedClientCredits.acknowledged) throw new AppError(500, "Database Error: Delete Failure", "DELETE_FAILURE");

    await session.commitTransaction();
    return res.status(200).json(deletedClient);
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
