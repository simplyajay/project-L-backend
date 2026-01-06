import { Types } from "mongoose";

export interface IUser {
  _id: Types.ObjectId;
  username: string;
  password: string;
  firstname: string;
  middlename?: string;
  lastname: string;
  nickname?: string;
  email: string;
  phone: IPhone;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPhone {
  country_code: string;
  dial_code: string;
  value: string;
  e164: string;
}

export type ISafeUser = Omit<IUser, "password"> & { password?: never };
