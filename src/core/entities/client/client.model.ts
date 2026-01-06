import mongoose, { Schema, Model } from "mongoose";
import { IClient } from "./client";
import { PhoneSchema } from "../user/user.model";

const ClientSchema = new Schema<IClient>(
  {
    userId: { type: Schema.Types.ObjectId, required: true }, // userId will come from query params; find a way to fix this
    firstname: { type: String, required: true },
    middlename: { type: String },
    nickname: { type: String },
    lastname: { type: String, required: true },
    email: { type: String },
    facebook: { type: String },
    phone: { type: PhoneSchema, required: true },
    otherPhones: { type: [PhoneSchema], default: [] },
    address: { type: String },
  },
  { timestamps: true }
);

ClientSchema.index({ userId: 1 });
ClientSchema.index({ userId: 1, phone: 1 });
ClientSchema.index({ userId: 1, otherPhones: 1 });

const ClientModel: Model<IClient> = mongoose.model<IClient>("Client", ClientSchema);
export default ClientModel;
