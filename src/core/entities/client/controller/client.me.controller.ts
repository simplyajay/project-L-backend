import { Request, Response } from "express";
import mongoose, { PipelineStage, Types } from "mongoose";
import { ClientSummaryType, ClientType, UpdateClientPayload } from "../client";
import { AppError } from "@/core/utils/error.util";
import { CreateClientPayload } from "../client";
import { PhoneSchema } from "../../user/user";
import clientRepository from "../client.repository";
import creditRepository from "../../credit/credit.repository";

export const create = async (req: Request<any, any, CreateClientPayload>, res: Response): Promise<Response> => {
  const userId = req.user?.id;
  const { phone, otherPhones, ...data } = req.body;

  if (!userId) throw new AppError(401, "Unauthorized: Invalid token", "UNAUTHORIZED");

  const primaryPhone = PhoneSchema.parse(phone);

  const others = otherPhones?.map((phone) => PhoneSchema.parse(phone));

  const clientData: Omit<ClientType, "_id"> = {
    userId,
    ...data,
    phone: primaryPhone,
    otherPhones: others,
  };

  const response = await clientRepository.createClient(clientData);
  return res.status(200).json(response);
};

export const getAll = async (req: Request, res: Response): Promise<Response> => {
  const userId = req.user.id;
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);

  const $match: PipelineStage.Match["$match"] = {
    userId: new Types.ObjectId(userId),
  };

  const $lookup: PipelineStage.Lookup["$lookup"] = {
    from: "credits",
    localField: "_id",
    foreignField: "clientId",
    as: "credits",
  };
  const $addFields: PipelineStage.AddFields["$addFields"] = {
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
          $cond: [
            { $gt: ["$unsettled", null] },
            {
              _id: "$$unsettled._id",
              balance: "$$unsettled.balance",
              creditDate: "$$unsettled.creditDate",
              dueDate: "$$unsettled.dueDate",
            },
            "$REMOVE",
          ],
        },
      },
    },
  };

  const $project: PipelineStage.Project["$project"] = {
    firstname: 1,
    middlename: 1,
    lastname: 1,
    totalBalance: 1,
    totalBalanceOverdue: 1,
    unsettledCredit: 1,
    createdAt: 1,
  };

  /**

     *  $lookup: Joins the 'credits' collection to pull all credits for each client.
     *  $addFields: Adds computed fields to each client:
     *    - totalBalance: sum of all credit balances.
     *    - totalBalanceOverdue: sum of balances for credits where dueDate is in the past.
     *    - unsettledCredit: first credit with balance > 0, projecting only _id, balance, creditDate, and dueDate.
     *    - Uses $let to store the first filtered credit (if not undefined or null ) and reshape it.
     * - $lookup brings in all credit fields
     */

  const pipeline: PipelineStage[] = [{ $match }, { $lookup }, { $addFields }, { $project }];

  const clients = await clientRepository.aggregateClients<ClientSummaryType>(pipeline);

  const totalOverdueAll = clients.reduce((sum, client) => sum + client.totalBalanceOverdue, 0);
  const totalBalanceAll = clients.reduce((sum, client) => sum + client.totalBalance, 0);

  const response = { clients, totalOverdueAll, totalBalanceAll };

  return res.status(200).json(response);
};

export const getOne = async (req: Request, res: Response): Promise<Response> => {
  const userId = req.user?.id;
  const { id } = req.params;

  const response = await clientRepository.getClient({ filter: { _id: id, userId } });
  return res.status(200).json(response);
};

export const updateOne = async (req: Request<any, any, UpdateClientPayload>, res: Response): Promise<Response> => {
  const userId = req.user?.id;
  const { id } = req.params;

  const { phone, otherPhones, ...data } = req.body;

  const primaryPhone = phone ? PhoneSchema.parse(phone) : undefined;

  const others = otherPhones?.map((phone) => PhoneSchema.parse(phone));

  const clientData: Partial<ClientType> = {
    ...data,
    ...(primaryPhone && { phone: primaryPhone }),
    ...(others && { otherPhones: others }),
  };

  const response = await clientRepository.updateClient({
    filter: { userId, _id: id },
    data: { $set: clientData },
  });

  return res.status(200).json(response);
};

export const deleteOne = async (req: Request, res: Response): Promise<Response> => {
  const userId = req.user?.id;
  const { id } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deletedClient = await clientRepository.deleteClient({ filter: { userId, _id: id }, options: { session } });

    if (!deletedClient) throw new AppError(404, "Client not Found", "NOT_FOUND");

    const deletedClientCredits = await creditRepository.deleteAllCredits({
      filter: { clientId: deletedClient._id },
      options: { session },
    });

    if (!deletedClientCredits.acknowledged) throw new AppError(500, "Database Error: Delete Failure", "DELETE_FAILURE");

    await session.commitTransaction();
    return res.status(200).json(deletedClient);
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
