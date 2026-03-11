import { Types } from "mongoose";
import z from "zod";

export type CreditType = {
  _id: Types.ObjectId;
  clientId: Types.ObjectId;
  principalAmount: number;
  interestRate: number;
  currentInterestAmount: number;
  balance: number;
  creditDate: Date;
  dueDate: Date;
  settlements: SettlementType[];
  history: HistoryType[];
};

export type SettlementType = {
  _id: Types.ObjectId;
  settlementAmount: number;
  interestAmount: number;
  settlementDate: Date;
};

export type HistoryType = {
  _id: Types.ObjectId;
  type: "Settlement" | "Adjustment";
  date: Date;
  note: string;
};

export const AddCreditSchema = z
  .object({
    principalAmount: z.number("Enter a valid amount.").positive(),
    interestRate: z.number().nonnegative(),
    creditDate: z.coerce.date(),
  })
  .strict();

export const updateCreditSchema = z
  .object({
    principalAmount: z.number().positive().optional(),
    interestRate: z.number().nonnegative().optional(),
    balance: z.number().nonnegative().optional(),
    creditDate: z.coerce.date().optional(),
    updateDate: z.coerce.date().optional(),
  })
  .strict();

export const AdminUpdateCreditSchema = updateCreditSchema
  .omit({ updateDate: true })
  .extend({ clientId: z.string().optional() })
  .strict();

export const AddSettlementSchema = z
  .object({
    settlementAmount: z.number().positive(),
    interestAmount: z.number().nonnegative(),
    settlementDate: z.coerce.date(),
  })
  .strict();

export type CreditSnapshotType = Pick<CreditType, "_id" | "principalAmount" | "balance" | "creditDate" | "dueDate">;

export type AddCreditPayload = z.infer<typeof AddCreditSchema>;

export type AdminUpdateCreditPayload = z.infer<typeof AdminUpdateCreditSchema>;

export type UpdateCreditPayload = z.infer<typeof updateCreditSchema>;

export type AddSettlementPayload = z.infer<typeof AddSettlementSchema>;
