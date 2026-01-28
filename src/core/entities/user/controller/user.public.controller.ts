import { Request, Response } from "express";
import { CreateUserPayload, PreferenceType, PhoneSchema, UserType } from "../user";
import { hashPassword } from "@/core/utils/password.util";
import userRepository from "../user.repository";

export const register = async (req: Request<any, any, CreateUserPayload>, res: Response): Promise<Response> => {
  const { password, role, preference, phone, ...rest } = req.body;

  const hashedPassword = await hashPassword(password);

  const defaultPreferrence: PreferenceType = {
    preferredCurrency: "AED",
    preferredDateFormat: "dmy",
  };

  const mobilePhone = PhoneSchema.parse(phone);

  const userData: Omit<UserType, "_id"> = {
    password: hashedPassword,
    role: role ? role : "user",
    preference: preference ?? defaultPreferrence,
    phone: mobilePhone,
    ...rest,
  };

  const response = await userRepository.createUser(userData);

  const message = `Welcome, ${response.firstname} ${response.lastname}!`;

  return res.status(200).json(message);
};
