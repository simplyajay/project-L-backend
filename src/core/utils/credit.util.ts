import { CreditType, AddSettlementPayload, UpdateCreditPayload } from "../entities/credit/credit";

export const calculateDueDate = (currentDate: Date): Date => {
  const dueDate = new Date(currentDate);
  dueDate.setMonth(dueDate.getMonth() + 1);
  return dueDate;
};

export const calculateNewBalance = (
  credit: CreditType,
  newSettlement: AddSettlementPayload,
): { newBalance: number; newInterestAmount: number } => {
  const currentBalance = credit.balance;

  const paidAmount = newSettlement.settlementAmount;

  const newBalance = Math.max(currentBalance - paidAmount, 0);

  const newInterestAmount = Math.max((newBalance * credit.interestRate) / 100, 0);

  return { newBalance, newInterestAmount };
};

export const adjustmentLabels: Record<keyof Omit<UpdateCreditPayload, "updateDate">, string> = {
  balance: "Balance",
  principalAmount: "Principal Amount",
  interestRate: "Interest Rate",
  creditDate: "Credit Date",
};
