import BaseRepository, {
  GetOperationParams,
  UpdateOperationParams,
  DeleteOperationParams,
  DeleteManyParams,
} from "../base";
import { DeleteResult, PipelineStage } from "mongoose";
import { AppError } from "@/core/utils/error.util";
import { CreditType } from "./credit";
import CreditModel from "./credit.model";

class CreditRepository extends BaseRepository<CreditType> {
  constructor() {
    super(CreditModel);
  }

  async createCredit(creditData: Omit<CreditType, "_id">): Promise<CreditType> {
    const credit = await this.create(creditData);
    return credit;
  }

  async getAll<T = CreditType>(pipeline: PipelineStage[]): Promise<T[]> {
    const credits: T[] = await this.model.aggregate<T>(pipeline);

    return credits;
  }

  async getCredit({ filter, projection }: GetOperationParams<CreditType> = {}): Promise<CreditType> {
    const [credit] = await this.model.aggregate<CreditType>([
      {
        $match: filter || {},
      },
      {
        $set: {
          settlements: {
            $sortArray: {
              input: "$settlements",
              sortBy: { settlementDate: -1 }, // newest first
            },
          },
          history: {
            $sortArray: {
              input: "$history",
              sortBy: { date: -1 }, // adjust field name if different
            },
          },
        },
      },
      {
        $project: projection && typeof projection === "object" ? { ...projection } : { __v: 0 },
      },
    ]);

    if (!credit) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    return credit;
  }

  async updateCredit({ filter, data, options }: UpdateOperationParams<CreditType>): Promise<CreditType> {
    const updatedCredit = await this.updateOne({
      filter,
      data,
      options,
    });

    if (!updatedCredit) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");
    return updatedCredit;
  }

  async deleteCredit({ filter, options }: DeleteOperationParams<CreditType> = {}): Promise<CreditType> {
    const deletedCredit = await this.deleteOne({ filter, options });
    if (!deletedCredit) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    return deletedCredit;
  }

  async deleteAllCredits({ filter, options }: DeleteManyParams<CreditType>): Promise<DeleteResult> {
    const deleted = await this.deleteMany({ filter, options });

    return deleted;
  }
}

export default new CreditRepository();
