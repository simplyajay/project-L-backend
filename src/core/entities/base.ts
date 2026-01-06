import { Model, FilterQuery, ProjectionType, QueryOptions, Types, UpdateQuery } from "mongoose";
import { handleMongoDuplicateError } from "../utils/error.util";

interface IDocumentOperationParams<T> {
  /** Query conditions to find the document. */
  filter?: FilterQuery<T>;
  /** Fields to include or exclude in the result. */
  projection?: ProjectionType<T>;
  /**  Additional Query options like sort, limit, skip. */
  options?: QueryOptions<T>;
  /**  Data to replace the original */
  data: UpdateQuery<T>;
}

export interface IGenericOperationParams<T> {
  filter?: Partial<Record<keyof T, any>>;
  projection?: Partial<Record<keyof T, any>>;
  options?: Record<string, any>;
}

class BaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    try {
      const doc = await this.model.create(data); // this returns HydratedDocument and not Plain object.
      return doc.toObject(); // toObject() is part of the HydratedDocument. toObject is the T
    } catch (error) {
      handleMongoDuplicateError(error);
      throw error;
    }
  }

  async findOne({
    filter = {},
    projection = {},
    options,
  }: Omit<IDocumentOperationParams<T>, "data"> = {}): Promise<T | null> {
    try {
      const finalProjection =
        projection && typeof projection === "object" ? { __v: 0, ...projection } : { __v: 0 };
      const doc = await this.model.findOne(filter, finalProjection, { ...options, lean: true });

      return doc as T;
    } catch (error) {
      throw error;
    }
  }

  async findAll({
    filter = {},
    projection = {},
    options = {},
  }: Omit<IDocumentOperationParams<T>, "data"> = {}): Promise<T[]> {
    try {
      const finalProjection =
        projection && typeof projection === "object" ? { __v: 0, ...projection } : { __v: 0 };
      const docs = await this.model.find(filter, finalProjection, { ...options, lean: true });
      return docs as T[];
    } catch (error) {
      throw error;
    }
  }

  async updateOne({
    filter = {},
    data,
    options = {},
  }: Omit<IDocumentOperationParams<T>, "projection">): Promise<T | null> {
    try {
      const doc = await this.model.findOneAndUpdate(filter, data, {
        new: true,
        ...options,
        lean: true,
      });

      return doc as T;
    } catch (error) {
      throw error;
    }
  }

  async deleteOne({
    filter,
    options,
  }: Omit<IDocumentOperationParams<T>, "data" | "projection"> = {}): Promise<T | null> {
    try {
      const doc = await this.model.findOneAndDelete(filter, { ...options, lean: true });
      return doc as T;
    } catch (error) {
      throw error;
    }
  }
}

export default BaseRepository;
