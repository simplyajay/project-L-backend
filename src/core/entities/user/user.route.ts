import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  getUserClients,
  updateUserById,
  deleteUserById,
} from "./user.controller";
import authenticateToken from "@/core/middlewares/authenticateToken";

const userRouter = express.Router();

userRouter.get("/", getAllUsers);
userRouter.post("/register", createUser);
userRouter.get("/:id", getUserById);
userRouter.get("/me/clients", authenticateToken, getUserClients);
userRouter.patch("/:id", updateUserById); // use react-hook-form in frontend. detect updated fields with formState.dirtFields
userRouter.delete("/:id", deleteUserById);

export default userRouter;
