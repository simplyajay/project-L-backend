import BaseRepository, { IGenericOperationParams } from "../base";
import CreditModel from "./credit.model";
import {
  ICredit,
  ICreditAddSettlement,
  ICreditHistory,
  IUpdateCreditPayload,
  ISettlement,
  ISafeCredit,
  calculateDueDate,
  calculateNewBalance,
  adjustmentLabels,
} from "./credit";
import { Request } from "express";
import { AppError } from "@/core/types/error";
import { excludeFields } from "@/core/utils/fields.util";
import { dateFormat, normalizeDate } from "@/core/utils/date.util";
import clientRepository from "../client/client.repository";
import mongoose from "mongoose";

class CreditRepository extends BaseRepository<ICredit> {
  constructor() {
    super(CreditModel);
  }

  async createCredit(req: Request<any, any, Omit<ICredit, "dueDate">>): Promise<ISafeCredit> {
    const { creditDate, ...rest } = req.body;

    const client = await clientRepository.findOne({ filter: { _id: rest.clientId } });

    if (!client) throw new AppError(404, "Resource not found", "NOT_FOUND");

    const dueDate = calculateDueDate(creditDate);

    const creditToSave: ICredit = {
      creditDate: normalizeDate(new Date(creditDate)),
      dueDate: normalizeDate(dueDate),
      ...rest,
    };

    const newCredit = await this.create(creditToSave);

    return excludeFields(newCredit, ["clientId"]);
  }

  async getAllCredits({
    filter = {},
    projection = {},
    options = {},
  }: IGenericOperationParams<ICredit> = {}): Promise<ISafeCredit[]> {
    if (filter.clientId && typeof filter.clientId === "string") {
      filter.clientId = new mongoose.Types.ObjectId(filter.clientId);
    }
    const credits: ICredit[] = await this.model.aggregate([
      { $match: filter },
      {
        $set: {
          settlements: {
            $sortArray: {
              input: "$settlements",
              sortBy: { settlementDate: -1 },
            },
          },
        },
      },
      {
        $project: {
          clientId: 0,
          __v: 0,
          ...projection,
        },
      },
      {
        $sort: options.sort ?? { creditDate: -1 },
      },
    ]);

    return credits.map((credit) => excludeFields(credit, ["clientId"]));
  }

  async getCreditById(req: Request): Promise<ISafeCredit> {
    const { id } = req.body;

    const credit = await this.findOne({ filter: { _id: id } });

    if (!credit) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    return excludeFields(credit, ["clientId"]);
  }

  async updateCreditDetails(req: Request<any, any, IUpdateCreditPayload>): Promise<ISafeCredit> {
    const { id } = req.params;
    const { updateDate, ...updates } = req.body;

    //create a helper function that clears potential undefined fields in updates

    const existingCredit = await this.findOne({ filter: { _id: id } });
    if (!existingCredit) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    const historyEntries: ICreditHistory[] = [];

    for (const [key, newValue] of Object.entries(updates)) {
      const oldValue = existingCredit[key as keyof ICredit];

      const label = adjustmentLabels[key] ?? key;

      if (key !== "currentInterestAmount" && oldValue !== newValue) {
        let note = `${label} changed from ${oldValue} to ${newValue}`;

        if (key === "dueDate" || key === "creditDate") {
          const oldDateReadable = oldValue.toLocaleString("en-US", dateFormat);
          const newDate = new Date(newValue);
          const newDateReadable = newDate.toLocaleDateString("en-US", dateFormat);
          note = `${label} changed from ${oldDateReadable} to ${newDateReadable}`;
        }

        historyEntries.push({
          type: "Adjustment",
          note,
          date: updateDate,
        });
      }
    }

    const updatedCredit = await this.updateOne({
      filter: { _id: id },
      data: {
        $set: {
          ...updates,
          ...(updates?.dueDate && { dueDate: normalizeDate(new Date(updates.dueDate)) }),
          ...(updates?.creditDate && { creditDate: normalizeDate(new Date(updates.creditDate)) }),
        },
        $push: { history: { $each: historyEntries } },
      },
    });

    if (!updatedCredit) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");
    return excludeFields(updatedCredit, ["clientId"]);
  }

  async addCreditSettlement(req: Request<any, any, ISettlement>): Promise<ISafeCredit> {
    const { id } = req.params;
    const newSettlement = req.body;

    const existingCredit = await this.findOne({ filter: { _id: id } });
    if (!existingCredit) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    const settlementDate = normalizeDate(new Date(newSettlement.settlementDate));
    const dueDate = new Date(existingCredit.dueDate);

    let updatedDueDate = new Date(dueDate);

    // first cycle will start at the initial due date
    // settlements made before first cycle are treated as no interest. therefore, keep the due date
    const cycleStart = new Date(dueDate);
    const cycleEnd = new Date(dueDate);
    cycleEnd.setMonth(cycleEnd.getMonth() + 1);

    const hasPartiallySettledThisCycle = existingCredit.settlements.some((settlement) => {
      return (
        new Date(settlement.settlementDate) > cycleStart &&
        new Date(settlement.settlementDate) <= cycleEnd
      );
    });

    if (settlementDate >= cycleStart && !hasPartiallySettledThisCycle) {
      updatedDueDate = calculateDueDate(dueDate);
    }

    const { newBalance, newInterestAmount } = calculateNewBalance(existingCredit, newSettlement);

    const credit: ICreditAddSettlement = {
      $set: {
        balance: newBalance,
        currentInterestAmount: newInterestAmount,
        dueDate: normalizeDate(updatedDueDate),
      },
      $push: {
        settlements: { ...newSettlement, settlementDate },
        history: {
          type: "Settlement",
          note: `Settlement of ${newSettlement.settlementAmount}${
            newSettlement.interestAmount > 0
              ? ` and interest of ${newSettlement.interestAmount}`
              : ""
          }`,
          date: settlementDate,
        },
      },
    };

    const updatedCredit = await this.updateOne({
      filter: { _id: id },
      data: credit,
    });

    if (!updatedCredit) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    return excludeFields(updatedCredit, ["clientId"]);
  }

  async deleteCreditById(req: Request): Promise<ISafeCredit> {
    const { id } = req.params;

    const deletedCredit = await this.deleteOne({ filter: { _id: id } });

    if (!deletedCredit) {
      if (!deletedCredit) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");
    }

    return excludeFields(deletedCredit, ["clientId"]);
  }
}

export default new CreditRepository();
