import mongoose, { Schema, Model } from "mongoose";
import { ClientType } from "./client";
import { PhoneSchema } from "../user/user.model";

const ClientSchema = new Schema<ClientType>(
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
  { timestamps: true },
);

ClientSchema.index({ userId: 1 });
ClientSchema.index({ userId: 1, "phone.e164": 1 }, { unique: true });

const ClientModel: Model<ClientType> = mongoose.model<ClientType>("Client", ClientSchema);
export default ClientModel;
