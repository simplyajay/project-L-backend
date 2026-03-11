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
    firstname: z.string("First name is required.").min(2, { error: "First name must be atleast 2 characters." }),
    middlename: z.string().min(2, { error: "Middle name must be atleast 2 characters." }).optional(),
    lastname: z.string("Last name is required.").min(2, { error: "Last name must be atleast 2 characters." }),
    email: z.email("Enter a valid email address").optional(),
    facebook: z.string().optional(),
    address: z.string("Address is required"),
    phone: PhoneInputSchema,
    otherPhones: z.array(PhoneInputSchema).optional(),
  })
  .strict();

export const UpdateClientSchema = z
  .object({
    firstname: z.string().min(2, { error: "First name must be atleast 2 characters." }).optional(),
    middlename: z.string().min(2, { error: "Middle name must be atleast 2 characters." }).optional(),
    lastname: z.string().min(2, { error: "Last name must be atleast 2 characters." }).optional(),
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

export const DeleteClientSchema = z.object({ password: z.string("Invalid Password") }).strict();

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

export type DeleteClientPayload = z.infer<typeof DeleteClientSchema>;
