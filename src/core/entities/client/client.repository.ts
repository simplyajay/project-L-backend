import BaseRepository, { IGenericOperationParams } from "../base";
import ClientModel from "./client.model";
import { IClient, ISafeClient, SummarizedClient } from "./client";
import { Request } from "express";
import { AppError } from "@/core/types/error";
import { ISafeCredit } from "../credit/credit";
import { excludeFields } from "@/core/utils/fields.util";
import creditRepository from "../credit/credit.repository";
import userRepository from "../user/user.repository";

class ClientRepository extends BaseRepository<IClient> {
  constructor() {
    super(ClientModel);
  }

  async createClient(req: Request<any, any, IClient>): Promise<ISafeClient> {
    const client = req.body;

    console.log(client);

    const user = await userRepository.findOne({ filter: { _id: client.userId } });

    if (!user) throw new AppError(404, "No Resource Found", "NOT_FOUND");

    const newClient = await this.create(client);

    return excludeFields(newClient, ["userId"]);
  }

  async getAllClients({
    filter = {},
    projection = {},
    options = {},
  }: IGenericOperationParams<ISafeClient> = {}): Promise<ISafeClient[]> {
    const clients = await this.findAll({
      filter,
      projection: { userId: 0, ...projection },
      options,
    });

    return clients.map((client) => excludeFields(client, ["userId"]));
  }

  async getAllSummarizedClients({
    filter = {},
    projection = {},
    options = {},
  }: IGenericOperationParams<ISafeClient> = {}): Promise<SummarizedClient[]> {
    const { sort, limit, skip } = options;

    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);

    /**
     * Aggregation pipeline to get client summaries with credit info.
     *
     * Steps:
     * 1. $match: Filters clients based on the provided criteria.
     * 2. $lookup: Joins the 'credits' collection to pull all credits for each client.
     * 3. $addFields: Adds computed fields to each client:
     *    - totalBalance: sum of all credit balances.
     *    - totalBalanceOverdue: sum of balances for credits where dueDate is in the past.
     *    - unsettledCredit: first credit with balance > 0, projecting only _id, balance, creditDate, and dueDate.
     *      Uses $let to store the first filtered credit and reshape it.
     * 4. $project: Keeps only the fields needed for frontend/UI to reduce payload.
     *
     * Notes:
     * - $lookup brings in all credit fields; you can optimize by projecting only necessary fields in the lookup.
     * - $addFields computes totals and selects the unsettled credit for convenience.
     * - $let is used to rename or reshape variables for easier projection.
     */
    const aggregatePipeline: any[] = [
      { $match: filter },
      { $lookup: { from: "credits", localField: "_id", foreignField: "clientId", as: "credits" } },
      {
        $addFields: {
          totalBalance: { $sum: "$credits.balance" },
          totalBalanceOverdue: {
            $sum: {
              $map: {
                input: "$credits",
                as: "credit",
                in: { $cond: [{ $lt: ["$$credit.dueDate", now] }, "$$credit.balance", 0] },
              },
            },
          },
          unsettledCredit: {
            $let: {
              vars: {
                unsettled: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$credits",
                        as: "credit",
                        cond: { $gt: ["$$credit.balance", 0] },
                      },
                    },
                    0,
                  ],
                },
              },
              in: {
                _id: "$$unsettled._id",
                balance: "$$unsettled.balance",
                creditDate: "$$unsettled.creditDate",
                dueDate: "$$unsettled.dueDate",
              },
            },
          },
        },
      },
      {
        $project: {
          firstname: 1,
          middlename: 1,
          lastname: 1,
          totalBalance: 1,
          totalBalanceOverdue: 1,
          unsettledCredit: 1,
          createdAt: 1,
        },
      },
    ];

    if (sort) aggregatePipeline.push({ $sort: sort });
    if (typeof skip === "number") aggregatePipeline.push({ $skip: skip });
    if (typeof limit === "number") aggregatePipeline.push({ $limit: limit });

    const summarizedClients: SummarizedClient[] = await this.model.aggregate(aggregatePipeline);

    return summarizedClients;
  }

  async getClientById(req: Request): Promise<ISafeClient> {
    const { id } = req.params;

    const client = await this.findOne({ filter: { _id: id }, projection: { userId: 0 } });
    if (!client) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    return excludeFields(client, ["userId"]);
  }

  async getClientCredits(req: Request): Promise<ISafeCredit[]> {
    //implement sort by creditDate here
    const { id } = req.params;

    const client = await this.findOne({ filter: { _id: id } });
    if (!client) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    const clientCredits = await creditRepository.getAllCredits({
      filter: { clientId: id },
      options: { sort: { creditDate: -1 } },
    });

    return clientCredits;
  }

  async updateClientById(req: Request<any, any, Partial<IClient>>): Promise<ISafeClient> {
    const updateData = req.body;
    const { id } = req.params;

    console.log(id);

    const updatedClient = await this.updateOne({ filter: { _id: id }, data: { $set: updateData } });
    if (!updatedClient) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    const { userId, ...safeClient } = updatedClient;

    return safeClient;
  }

  async deleteClientById(req: Request): Promise<ISafeClient> {
    const { id } = req.params;
    const deletedClient = await this.deleteOne({ filter: { _id: id } });
    if (!deletedClient) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    const { userId, ...safeClient } = deletedClient;
    return safeClient;
  }
}
export default new ClientRepository();
