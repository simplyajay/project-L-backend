import mongoose, { Schema, Model } from "mongoose";
import { IPhone, IUser } from "./user";

export const PhoneSchema = new Schema<IPhone>({
  country_code: { type: String, required: true },
  dial_code: { type: String, required: true },
  value: { type: String, required: true },
  e164: { type: String, required: true },
});

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
    firstname: { type: String, required: true },
    middlename: { type: String },
    lastname: { type: String, required: true },
    nickname: { type: String },
    email: { type: String, required: true },
    phone: { type: PhoneSchema, required: true },
  },
  { timestamps: true }
);

UserSchema.index({ username: 1 }, { unique: true, collation: { locale: "en", strength: 1 } });
UserSchema.index({ email: 1 }, { unique: true, collation: { locale: "en", strength: 1 } });
UserSchema.index({ phone: 1 }, { unique: true, collation: { locale: "en", strength: 1 } });

const UserModel: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default UserModel;
