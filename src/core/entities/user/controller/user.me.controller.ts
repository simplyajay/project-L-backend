import { Request, Response } from "express";
import { AppError } from "@/core/utils/error.util";
import { hashPassword, isPasswordMatch } from "@/core/utils/password.util";
import { UserType, PhoneSchema, UpdatePasswordPayload, UpdateUserPayload, UserDTOType } from "../user";
import userRepository from "../user.repository";
import mongoose from "mongoose";
import clientRepository from "../../client/client.repository";

export const updateMyPersonalInformation = async (
  req: Request<any, any, Partial<UpdateUserPayload>>,
  res: Response,
) => {
  const userId = req.user.id;
  const { phone, ...updates } = req.body;

  const updateData: Partial<UserType> = phone ? { ...updates, phone: PhoneSchema.parse(phone) } : updates;

  const user = await userRepository.updateUser<UserDTOType>({
    filter: { _id: userId },
    data: { $set: updateData },
    options: { projection: { __v: 0, password: 0 } },
  });

  return res.status(200).json(user);
};

export const updateMyPassword = async (req: Request<any, any, UpdatePasswordPayload>, res: Response) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  const user = await userRepository.getUser({ filter: { _id: userId } });

  if (!user) throw new AppError(404, "Unexpected Error", "NOT_FOUND");

  const isMatch = await isPasswordMatch(currentPassword, user.password);

  if (!isMatch) throw new AppError(401, "Invalid Current Password", "INVALID_CREDENTIALS");

  const isPasswordSame = await isPasswordMatch(newPassword, user.password);

  if (isPasswordSame) throw new AppError(400, "New password can’t be the same as current password.", "BAD_REQUEST");

  const hashedNewPassword = await hashPassword(newPassword);

  const updatedUser = await userRepository.updateUser({
    filter: { _id: userId },
    data: { $set: { password: hashedNewPassword } },
  });

  const message = "Password changed successfully";

  return res.status(200).json(message);
};

export const deleteMe = async (req: Request<any, any, { password: string }>, res: Response) => {
  const userId = req.user.id;
  const { password } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  const me = await userRepository.getUser({ filter: { _id: userId } });

  if (!me) throw new AppError(404, "Username or password is incorrect.", "NOT_FOUND");

  const match = await isPasswordMatch(password, me.password);

  if (!match) throw new AppError(401, "Invalid Credentials", "INVALID_CREDENTIALS");

  try {
    const deletedUser = await userRepository.deleteUser<UserDTOType>({
      filter: { _id: userId },
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
