import { Request, Response } from "express";
import { dateFormat, parseDate } from "@/core/utils/date.util";
import { PipelineStage, Types } from "mongoose";
import { AppError } from "@/core/utils/error.util";
import { CreditType, AddCreditPayload, UpdateCreditPayload, HistoryType, AddSettlementPayload } from "../credit";
import { adjustmentLabels, calculateDueDate, calculateNewBalance } from "@/core/utils/credit.util";
import { CreditSnapshotType } from "../credit";
import { typedEntries } from "@/core/utils/object.util";
import creditRepository from "../credit.repository";

export const create = async (req: Request<any, any, AddCreditPayload>, res: Response): Promise<Response> => {
  const clientId = req.clientId;

  const { principalAmount, interestRate, creditDate } = req.body;
  const currentInterestAmount = Math.max((principalAmount * interestRate) / 100, 0);

  const dueDate = calculateDueDate(creditDate);

  const newCredit: Omit<CreditType, "_id"> = {
    ...req.body,
    clientId,
    balance: principalAmount,
    currentInterestAmount,
    creditDate: parseDate(new Date(creditDate)),
    dueDate: parseDate(dueDate),
    settlements: [],
    history: [],
  };

  const response = await creditRepository.createCredit(newCredit);

  return res.status(200).json(response);
};

export const getAll = async (req: Request, res: Response): Promise<Response> => {
  const clientId = req.clientId;

  const $match: PipelineStage.Match["$match"] = { clientId };

  const $project: PipelineStage.Project["$project"] = { principalAmount: 1, balance: 1, creditDate: 1, dueDate: 1 };

  const $sort: PipelineStage.Sort["$sort"] = { creditDate: -1 };

  const pipeline: PipelineStage[] = [{ $match }, { $project }, { $sort }];

  const response = await creditRepository.getAll<CreditSnapshotType>(pipeline);

  return res.status(200).json(response);
};

export const getOne = async (req: Request, res: Response): Promise<Response> => {
  const clientId = req.clientId;
  const { creditId } = req.params;

  const response = await creditRepository.getCredit({ filter: { clientId, _id: new Types.ObjectId(creditId) } });

  return res.status(200).json(response);
};

export const updateOne = async (
  req: Request<any, any, UpdateCreditPayload & { updateDate?: Date }>,
  res: Response,
): Promise<Response> => {
  const clientId = req.clientId;
  const { creditId } = req.params;

  const { updateDate, ...updateData } = req.body;

  const currentCredit = await creditRepository.getCredit({ filter: { clientId, _id: creditId } });
  if (!currentCredit) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

  let currentInterestAmount: number = currentCredit.currentInterestAmount;

  const history: Omit<HistoryType, "_id">[] = [];

  for (const [key, newValue] of typedEntries(updateData)) {
    const oldValue = currentCredit[key];

    //date comparison will not work here. === only works on primitives
    if (key !== "creditDate" && oldValue === newValue) continue;

    const label = adjustmentLabels[key] ?? key;
    let note: string;

    if (key === "interestRate" && typeof newValue === "number") {
      const balanceToCalculate = updateData.balance ?? currentCredit.balance;
      currentInterestAmount = Math.max((balanceToCalculate * newValue) / 100, 0);
    }

    if (key === "creditDate" && newValue instanceof Date && oldValue instanceof Date) {
      //compare date

      const oldDate = parseDate(oldValue);
      const newDate = parseDate(newValue);

      if (oldDate.getTime() === newDate.getTime()) continue;
      if (isNaN(newDate.getTime()) || isNaN(oldDate.getTime())) continue;

      const oldDateReadable = oldDate.toLocaleDateString("en-US", dateFormat);

      const newDateReadable = newDate.toLocaleDateString("en-US", dateFormat);
      note = `${label} changed from ${oldDateReadable} to ${newDateReadable}`;
    } else {
      note = `${label} changed from ${oldValue} to ${newValue}`;
    }

    history.push({
      type: "Adjustment",
      note,
      date: updateDate ?? new Date(), // fallback to now if not provided
    });
  }

  const creditDate = updateData.creditDate ? new Date(updateData.creditDate) : undefined;
  const dueDate = creditDate ? calculateDueDate(creditDate) : undefined;

  const updates: Partial<CreditType> = dueDate
    ? { ...updateData, currentInterestAmount, dueDate, creditDate }
    : { ...updateData, currentInterestAmount, creditDate };

  const response = await creditRepository.updateCredit({
    filter: { clientId, _id: creditId },
    data: { $set: { ...updates }, $push: { history: { $each: history } } },
  });

  return res.status(200).json(response);
};

export const deleteOne = async (req: Request, res: Response): Promise<Response> => {
  const clientId = req.clientId;
  const { creditId } = req.params;

  const response = await creditRepository.deleteCredit({ filter: { clientId, _id: creditId } });

  return res.status(200).json(response);
};

export const addSettlement = async (req: Request<any, any, AddSettlementPayload>, res: Response): Promise<Response> => {
  const clientId = req.clientId;
  const { creditId } = req.params;

  const settlementData = req.body;

  const currentCredit = await creditRepository.getCredit({ filter: { clientId, _id: creditId } });
  if (!currentCredit) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

  const settlementDate = parseDate(settlementData.settlementDate);

  // first cycle will start at the initial due date
  // settlements made before first cycle are treated as no interest. therefore, keep the duedate
  const cycleStart = parseDate(currentCredit.dueDate);
  const cycleEnd = parseDate(cycleStart);
  cycleEnd.setMonth(cycleEnd.getMonth() + 1);

  let dueDate = parseDate(cycleStart);

  const hasPartiallySettledThisCycle = currentCredit.settlements.some((settlement) => {
    return settlement.settlementDate > cycleStart && settlement.settlementDate <= cycleEnd;
  });

  if (settlementDate >= cycleStart && !hasPartiallySettledThisCycle) {
    dueDate = calculateDueDate(cycleStart);
  }

  const { newBalance, newInterestAmount } = calculateNewBalance(currentCredit, settlementData);

  const creditUpdates: { balance: number; currentInterestAmount: number; dueDate: Date } = {
    balance: newBalance,
    currentInterestAmount: newInterestAmount,
    dueDate: parseDate(dueDate),
  };

  const history: Omit<HistoryType, "_id"> = {
    type: "Settlement",
    note:
      settlementData.interestAmount > 0
        ? `Settlement of ${settlementData.settlementAmount}`
        : `Settlement of ${settlementData.settlementAmount} and interest of ${settlementData.interestAmount}`,
    date: settlementDate,
  };

  const response = await creditRepository.updateCredit({
    filter: { clientId, _id: creditId },
    data: { $set: creditUpdates, $push: { settlements: settlementData, history } },
  });

  if (!response) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

  return res.status(200).json(response);
};
