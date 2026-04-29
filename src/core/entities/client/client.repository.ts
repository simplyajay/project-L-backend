import BaseRepository, {
  GetOperationParams,
  UpdateOperationParams,
  DeleteOperationParams,
  DeleteManyParams,
} from "../base";
import ClientModel from "./client.model";
import { ClientType } from "./client";
import { AppError } from "@/core/utils/error.util";
import { DeleteResult, PipelineStage } from "mongoose";

class ClientRepository extends BaseRepository<ClientType> {
  constructor() {
    super(ClientModel);
  }

  async createClient(clientData: Omit<ClientType, "_id">): Promise<ClientType> {
    const client = await this.create(clientData);

    return client;
  }

  async getAllClients({ filter = {}, projection, options = {} }: GetOperationParams<ClientType> = {}): Promise<
    ClientType[]
  > {
    const clients = await this.findAll({
      filter,
      projection: projection && typeof projection === "object" ? projection : { __v: 0 },
      options,
    });

    return clients;
  }

  async aggregateClients<T = ClientType>(pipeline: PipelineStage[]): Promise<T[]> {
    const clients: T[] = await this.model.aggregate(pipeline);

    return clients;
  }

  async getClient({
    filter = {},
    projection = {},
    options = {},
  }: GetOperationParams<ClientType> = {}): Promise<ClientType> {
    const client = await this.findOne({
      filter,
      projection: projection && typeof projection === "object" ? projection : { __v: 0 },
      options,
    });
    if (!client) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    return client;
  }

  async updateClient({ filter, data, options }: UpdateOperationParams<ClientType>): Promise<ClientType> {
    const updatedClient = await this.updateOne({ filter, data, options });

    if (!updatedClient) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    return updatedClient;
  }

  async deleteClient({ filter, options }: DeleteOperationParams<ClientType>): Promise<ClientType> {
    const deletedClient = await this.deleteOne({ filter, options });
    if (!deletedClient) throw new AppError(404, "Resource Not Found", "NO_RESOURCE");

    return deletedClient;
  }

  async deleteAllClients({ filter, options }: DeleteManyParams<ClientType>): Promise<DeleteResult> {
    const deleted = await this.deleteMany({ filter, options });

    return deleted;
  }
}
export default new ClientRepository();
