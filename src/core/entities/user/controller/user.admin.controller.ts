import { Request, Response } from "express";
import { UpdateUserPayload, PhoneSchema, UserType, UserDTOType } from "../user";
import { AppError } from "@/core/utils/error.util";
import mongoose from "mongoose";
import clientRepository from "../../client/client.repository";
import userRepository from "../user.repository";

export const getAll = async (req: Request, res: Response): Promise<Response> => {
  const response = await userRepository.getAllUsers<UserDTOType>({ projection: { __v: 0, password: 0 } });

  return res.status(200).json(response);
};

export const getOne = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const response = await userRepository.getUser<UserDTOType>({
    filter: { _id: id },
    projection: { __v: 0, password: 0 },
  });
  return res.status(200).json(response);
};

export const updateOne = async (
  req: Request<any, any, Partial<UpdateUserPayload>>,
  res: Response,
): Promise<Response> => {
  const { id } = req.params;
  const { phone, ...updates } = req.body;

  const updateData: Partial<UserType> = phone ? { ...updates, phone: PhoneSchema.parse(phone) } : updates;

  const response = await userRepository.updateUser<UserDTOType>({
    filter: { _id: id },
    data: { $set: updateData },
    options: { projection: { __v: 0, password: 0 } },
  });
  return res.status(200).json(response);
};

export const deleteOne = async (req: Request, res: Response): Promise<Response> => {
  const userId = req.user.id;
  const { id } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (userId.toString() === id) throw new AppError(403, "Admin cannot delete itself", "FORBIDDEN");

    const deletedUser = await userRepository.deleteUser<UserDTOType>({
      filter: { _id: id },
      options: { projection: { __v: 0, password: 0 }, session },
    });

    if (!deletedUser) throw new AppError(404, "Resource Not Found", "NOT_FOUND");

    const deletedUserClients = await clientRepository.deleteAllClients({
      filter: { userId: deletedUser._id },
      options: { session },
    });

    if (!deletedUserClients.acknowledged) throw new AppError(500, "Database Error: Delete Failure", "DELETE_FAILURE");

    await session.commitTransaction();
    return res.status(200).json(deletedUser);
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
