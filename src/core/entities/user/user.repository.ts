import UserModel from "@/core/entities/user/user.model";
import BaseRepository, { IGenericOperationParams } from "../base";
import clientRepository from "../client/client.repository";
import { Request } from "express";
import { hashPassword } from "@/core/utils/password.util";
import { IUser, ISafeUser } from "./user";
import { AppError } from "@/core/types/error";
import { excludeFields } from "@/core/utils/fields.util";
import { ISafeClient, SummarizedClient } from "../client/client";
import { Types } from "mongoose";

interface IClientQuery {
  search?: string;
  sortBy?: "firstname" | "createdAt" | "balance" | "dueDate";
  direction?: 1 | -1;
}

class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserModel);
  }

  async createUser(req: Request<any, any, Partial<IUser>>): Promise<ISafeUser> {
    const { password, ...rest } = req.body;

    if (!password) {
      throw new AppError(404, "Password not found", "NOT_FOUND");
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await this.create({ password: hashedPassword, ...rest });

    return excludeFields(newUser, ["password"]);
  }

  async getAllUsers({
    filter,
    projection = {},
    options,
  }: IGenericOperationParams<IUser> = {}): Promise<ISafeUser[]> {
    const users = await this.findAll({
      filter,
      projection: { password: 0, ...projection },
      options,
    });

    const safeUsers = users.map((user) => excludeFields(user, ["password"]));
    return safeUsers;
  }

  async getUserById(req: Request): Promise<ISafeUser> {
    const { id } = req.params;

    const user = await this.findOne({ filter: { _id: id } });

    if (!user) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    return excludeFields(user, ["password"]);
  }

  async getUserSummarizedClients(
    req: Request<any, any, any, IClientQuery>
  ): Promise<{
    summarizedClients: SummarizedClient[];
    totalOverdueAll: number;
    totalBalanceAll: number;
  }> {
    const id = req.user?.id;

    const summarizedClients = await clientRepository.getAllSummarizedClients({
      filter: {
        userId: new Types.ObjectId(id),
      },
    });

    const totalOverdueAll = summarizedClients.reduce(
      (sum, client) => sum + client.totalBalanceOverdue,
      0
    );
    const totalBalanceAll = summarizedClients.reduce((sum, client) => sum + client.totalBalance, 0);

    return { summarizedClients, totalBalanceAll, totalOverdueAll };
  }

  async updateUserById(req: Request<any, any, Partial<IUser>>): Promise<ISafeUser> {
    const updates = req.body;
    const { id } = req.params;

    const updatedUser = await this.updateOne({
      filter: { _id: id },
      data: { $set: updates },
    });

    if (!updatedUser) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    return excludeFields(updatedUser, ["password"]);
  }

  async deleteUserById(req: Request): Promise<ISafeUser> {
    const { id } = req.params;

    const deletedUser = await this.deleteOne({ filter: { _id: id } });
    if (!deletedUser) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    return excludeFields(deletedUser, ["password"]);
  }
}

export default new UserRepository();
