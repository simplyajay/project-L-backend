import { Types } from "mongoose";
import { CreditType } from "../credit/credit";
import { PhoneType } from "../user/user";
import { PhoneInputSchema } from "../user/user";
import z from "zod";

export type ClientType = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  firstname: string;
  middlename?: string;
  nickname?: string;
  lastname: string;
  email?: string;
  facebook?: string;
  phone: PhoneType;
  otherPhones?: PhoneType[];
  address: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export const CreateClientSchema = z
  .object({
    firstname: z.string().min(2),
    middlename: z.string().min(2).optional(),
    lastname: z.string().min(2),
    email: z.email().optional(),
    facebook: z.string().optional(),
    address: z.string(),
    phone: PhoneInputSchema,
    otherPhones: z.array(PhoneInputSchema).optional(),
  })
  .strict();

export const UpdateClientSchema = z
  .object({
    firstname: z.string().min(2).optional(),
    middlename: z.string().min(2).optional(),
    lastname: z.string().min(2).optional(),
    email: z.email().optional(),
    facebook: z.string().optional(),
    address: z.string().optional(),
    phone: PhoneInputSchema.optional(),
    otherPhones: z.array(PhoneInputSchema).optional(),
  })
  .strict();

export const AdminUpdateClientSchema = UpdateClientSchema.extend({
  userId: z.string().optional(),
}).strict();

export type ClientSummaryType = {
  _id: Types.ObjectId;
  firstname: string;
  middlename?: string;
  lastname: string;
  totalBalance: number;
  totalBalanceOverdue: number;
  unsettledCredit: CreditType;
};

export type CreateClientPayload = z.infer<typeof CreateClientSchema>;

export type UpdateClientPayload = z.infer<typeof UpdateClientSchema>;

export type AdminUpdateClientPayload = z.infer<typeof AdminUpdateClientSchema>;
