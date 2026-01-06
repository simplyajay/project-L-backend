import { Types } from "mongoose";

export interface ICredit {
  clientId: Types.ObjectId;
  principalAmount: number;
  interestRate: number;
  currentInterestAmount: number;
  balance: number;
  creditDate: Date;
  dueDate: Date;
  settlements: ISettlement[];
  history: ICreditHistory[];
}

export type IUpdateCreditPayload = Omit<
  ICredit,
  "clientId" | "principalAmount" | "history" | "settlements"
> & {
  updateDate: Date;
};

export interface ISettlement {
  _id: Types.ObjectId;
  settlementAmount: number;
  interestAmount: number;
  settlementDate: Date;
}

export interface ICreditHistory {
  type: "Settlement" | "Adjustment";
  date: Date;
  note: string;
}

export const adjustmentLabels: Record<string, string> = {
  balance: "Balance",
  principalAmount: "Principal Amount",
  interestRate: "Interest Rate",
  creditDate: "Credit Date",
  dueDate: "Due Date",
};

export interface ICreditAddSettlement {
  $set: Partial<{ balance: number; dueDate: Date; currentInterestAmount: number }>;
  $push: { settlements: ISettlement; history: ICreditHistory };
}

export type ISafeCredit = Omit<ICredit, "clientId"> & { clientId?: never };

export const calculateDueDate = (date: Date) => {
  const dueDate = new Date(date);
  dueDate.setMonth(dueDate.getMonth() + 1);
  return dueDate;
};

export const calculateNewBalance = (
  credit: ICredit,
  newSettlement: ISettlement
): { newBalance: number; newInterestAmount: number } => {
  const currentBalance = credit.balance;

  const paidAmount = newSettlement.settlementAmount;

  const newBalance = Math.max(currentBalance - paidAmount, 0);

  const newInterestAmount = Math.max((newBalance * credit.interestRate) / 100, 0);

  return { newBalance, newInterestAmount };
};
