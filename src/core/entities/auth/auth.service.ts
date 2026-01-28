import { Request } from "express";
import { generateAccessToken, LoginCredentials } from "./auth";
import { isPasswordMatch } from "@/core/utils/password.util";
import { AppError } from "@/core/utils/error.util";
import { UserDTOType } from "../user/user";
import userRepository from "../user/user.repository";

export const handleLogin = async (
  req: Request<any, any, LoginCredentials>,
): Promise<{ accessToken: string; user: UserDTOType }> => {
  const { identifier, loginPassword } = req.body;

  const user = await userRepository.getUser({
    filter: { $or: [{ email: identifier }, { username: identifier }] },
  });

  if (!user) throw new AppError(404, "Username or password is incorrect.", "NOT_FOUND");

  const match = await isPasswordMatch(loginPassword, user.password);

  if (!match) throw new AppError(401, "Invalid Credentials", "INVALID_CREDENTIALS");

  const { password, ...safe } = user;
  const safeUser: UserDTOType = safe;
  const accessToken = generateAccessToken(safeUser, safeUser.role);

  return { accessToken, user: safeUser };
};

export const handleLogout = async (req: Request): Promise<boolean> => {
  return true;
};
