import { Request } from "express";
import { generateAccessToken, ILoginCredentials } from "./auth";
import { isPasswordMatch } from "@/core/utils/password.util";
import { AppError } from "@/core/types/error";
import userRepository from "../user/user.repository";
import { ISafeUser } from "../user/user";

export const handleLogin = async (
  req: Request<any, any, ILoginCredentials>
): Promise<{ accessToken: string; user: ISafeUser }> => {
  const { identifier, loginPassword } = req.body;

  console.log("logging in");
  const user = await userRepository.findOne({
    filter: { $or: [{ email: identifier }, { username: identifier }] },
  });

  if (!user) throw new AppError(404, "Username or password is incorrect.", "NOT_FOUND");

  const match = await isPasswordMatch(loginPassword, user.password);

  if (!match) throw new AppError(401, "Invalid Credentials", "INVALID_CREDENTIALS");

  const { password, ...safe } = user;
  const safeUser: ISafeUser = safe;
  const accessToken = generateAccessToken(safeUser);

  return { accessToken, user: safeUser };
};

export const handleLogout = async (req: Request): Promise<boolean> => {
  return true;
};
