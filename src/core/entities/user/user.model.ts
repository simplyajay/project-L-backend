import mongoose, { Schema, Model } from "mongoose";
import { PhoneType, UserType, PreferenceType } from "./user";

export const PhoneSchema = new Schema<PhoneType>({
  country_code: { type: String, required: true },
  dial_code: { type: String, required: true },
  value: { type: String, required: true },
  e164: { type: String, required: true },
});

const PreferenceSchema = new Schema<PreferenceType>({
  preferredCurrency: { type: String, required: true },
  preferredDateFormat: { type: String, enum: ["dmy", "mdy", "ymd"], default: "dmy" },
});

const UserSchema = new Schema<UserType>(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
    firstname: { type: String, required: true },
    middlename: { type: String },
    lastname: { type: String, required: true },
    nickname: { type: String },
    email: { type: String, required: true },
    phone: { type: PhoneSchema, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    preference: { type: PreferenceSchema, required: true },
  },
  { timestamps: true },
);

UserSchema.index({ username: 1 }, { unique: true, collation: { locale: "en", strength: 1 } });
UserSchema.index({ email: 1 }, { unique: true, collation: { locale: "en", strength: 1 } });
UserSchema.index({ "phone.e164": 1 }, { unique: true });

const UserModel: Model<UserType> = mongoose.model<UserType>("User", UserSchema);

export default UserModel;
