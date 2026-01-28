import { Request, Response } from "express";
import { PipelineStage, Types } from "mongoose";
import { AdminUpdateCreditPayload, CreditType } from "../credit";
import { AppError } from "@/core/utils/error.util";
import { calculateDueDate } from "@/core/utils/credit.util";
import creditRepository from "../credit.repository";

export const getAll = async (req: Request, res: Response): Promise<Response> => {
  const $set: PipelineStage.Set["$set"] = {
    settlements: {
      $sortArray: {
        input: "$settlements",
        sortBy: { settlementDate: -1 },
      },
    },
    history: {
      $sortArray: {
        input: "$history",
        sortBy: { date: -1 },
      },
    },
  };

  const $project: PipelineStage.Project["$project"] = { __v: 0 };
  const $sort: PipelineStage.Sort["$sort"] = { creditDate: -1 };

  const pipeline: PipelineStage[] = [{ $set }, { $project }, { $sort }];
  const response = await creditRepository.getAll(pipeline);

  return res.status(200).json(response);
};

export const getOne = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const response = creditRepository.getCredit({ filter: { _id: id } });

  return res.status(200).json(response);
};

/** This function is not recording history and settlement log */
export const updateOne = async (req: Request<any, any, AdminUpdateCreditPayload>, res: Response): Promise<Response> => {
  const { id } = req.params;
  const updateData = req.body;

  const _id = id && typeof id === "string" ? new Types.ObjectId(id) : id;

  const currentCredit = await creditRepository.getCredit({ filter: { _id } });
  if (!currentCredit) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

  let currentInterestAmount: number = currentCredit.currentInterestAmount;

  if (updateData.interestRate) {
    const balanceToCalculate = updateData.balance ?? currentCredit.balance;
    console.log(updateData.interestRate);
    currentInterestAmount = Math.max((balanceToCalculate * updateData.interestRate) / 100, 0);
  }

  const dueDate = updateData.creditDate ? calculateDueDate(updateData.creditDate) : undefined;

  const updates: Partial<CreditType> = {
    ...updateData,
    clientId: updateData.clientId ? new Types.ObjectId(updateData.clientId) : undefined,
    currentInterestAmount,
    dueDate,
  };

  const response = await creditRepository.updateCredit({ filter: { _id: id }, data: updates });

  return res.status(200).json(response);
};

export const deleteOne = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const response = await creditRepository.deleteCredit({ filter: { _id: id } });

  return res.status(200).json(response);
};
