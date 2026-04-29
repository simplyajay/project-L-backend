import {
  Model,
  FilterQuery,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
  DeleteResult,
  MongooseBaseQueryOptions,
  ClientSession,
} from "mongoose";
import { handleMongoDuplicateError } from "../utils/error.util";

export type GetOperationParams<T> = {
  /** Query conditions to find the document. */
  filter?: FilterQuery<T>;
  /** Fields to include or exclude in the result. */
  projection?: ProjectionType<T>;
  /**  Additional Query options like sort, limit, skip. */
  options?: QueryOptions<T>;
};

export type UpdateOperationParams<T> = {
  /** Query conditions to find the document. */
  filter?: FilterQuery<T>;
  /**  Data to replace the original */
  data: UpdateQuery<T>;
  /**  Additional Query options like sort, limit, skip. */
  options?: QueryOptions<T>;
};

export type DeleteOperationParams<T> = {
  /** Query conditions to find the document. */
  filter?: FilterQuery<T>;
  /**  Additional Query options like sort, limit, skip. */
  options?: QueryOptions<T> & { session?: ClientSession };
};

export type DeleteManyParams<T> = {
  /** Query conditions to find the document. */
  filter?: FilterQuery<T>;
  options?: MongooseBaseQueryOptions<T> & { session?: ClientSession };
};

class BaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  protected async create(data: Partial<T>): Promise<T> {
    try {
      const doc = await this.model.create(data); // this returns HydratedDocument and not Plain object.
      return doc.toObject(); // toObject() is part of the HydratedDocument. toObject is the T
    } catch (error) {
      handleMongoDuplicateError(error);
      throw error;
    }
  }

  protected async findOne({ filter, projection, options }: GetOperationParams<T>): Promise<T | null> {
    try {
      const doc = await this.model.findOne(filter, projection, { ...options, lean: true });

      return doc as T;
    } catch (error) {
      throw error;
    }
  }

  protected async findAll({ filter = {}, projection, options }: GetOperationParams<T> = {}): Promise<T[]> {
    try {
      const docs = await this.model.find(filter, projection, { ...options, lean: true });
      return docs as T[];
    } catch (error) {
      throw error;
    }
  }

  protected async updateOne({ filter, data, options }: UpdateOperationParams<T>): Promise<T | null> {
    try {
      const doc = await this.model.findOneAndUpdate(filter, data, {
        new: true,
        ...options,
        lean: true,
      });

      return doc as T;
    } catch (error) {
      handleMongoDuplicateError(error);
      throw error;
    }
  }

  protected async deleteOne({ filter, options }: DeleteOperationParams<T> = {}): Promise<T | null> {
    try {
      const doc = await this.model.findOneAndDelete(filter, { ...options, lean: true });
      return doc as T;
    } catch (error) {
      throw error;
    }
  }

  protected async deleteMany({ filter, options }: DeleteManyParams<T>): Promise<DeleteResult> {
    try {
      const doc = await this.model.deleteMany(filter, options);
      return doc;
    } catch (error) {
      throw error;
    }
  }
}

export default BaseRepository;
