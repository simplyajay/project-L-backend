import UserModel from "@/core/entities/user/user.model";
import BaseRepository, { DeleteOperationParams, GetOperationParams, UpdateOperationParams } from "../base";
import { UserType } from "./user";
import { AppError } from "@/core/utils/error.util";

class UserRepository extends BaseRepository<UserType> {
  constructor() {
    super(UserModel);
  }

  async createUser<T = UserType>(userData: Omit<UserType, "_id">): Promise<T> {
    const newUser = await this.create(userData);

    return newUser as T;
  }

  async getAllUsers<T = UserType>({ filter, projection, options }: GetOperationParams<UserType> = {}): Promise<T[]> {
    const users = await this.findAll({
      filter,
      projection: projection && typeof projection === "object" ? projection : { __v: 0 },
      options,
    });

    return users as T[];
  }

  async getUser<T = UserType>({ filter, projection, options }: GetOperationParams<UserType> = {}): Promise<T> {
    const user = await this.findOne({
      filter,
      projection: projection && typeof projection === "object" ? projection : { __v: 0 },
      options,
    });

    if (!user) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    return user as T;
  }

  async updateUser<T = UserType>({ filter, data, options }: UpdateOperationParams<UserType>): Promise<T> {
    const updatedUser = await this.updateOne({
      filter,
      data,
      options,
    });

    if (!updatedUser) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    return updatedUser as T;
  }

  async deleteUser<T = UserType>({ filter, options }: DeleteOperationParams<UserType> = {}): Promise<T> {
    const deletedUser = await this.deleteOne({ filter, options });
    if (!deletedUser) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    return deletedUser as T;
  }
}

export default new UserRepository();
