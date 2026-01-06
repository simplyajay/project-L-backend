import { Types } from "mongoose";
import { ICredit, ISafeCredit } from "../credit/credit";
import { IPhone } from "../user/user";

export interface IClient {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  firstname: string;
  middlename?: string;
  nickname?: string;
  lastname: string;
  email?: string;
  facebook?: string;
  phone: IPhone;
  otherPhones?: IPhone[];
  address: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ISafeClient = Omit<IClient, "userId"> & { userId?: never };

export type SummarizedClient = {
  _id: Types.ObjectId;
  firstname: string;
  middlename?: string;
  lastname: string;
  totalBalance: number;
  totalBalanceOverdue: number;
  unsettledCredit: ICredit;
};
