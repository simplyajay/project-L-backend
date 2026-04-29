import { Types } from "mongoose";
import z from "zod";
import { parsePhoneNumberFromString, CountryCode, getCountryCallingCode } from "libphonenumber-js/max";

export type UserType = {
  _id: Types.ObjectId;
  username: string;
  password: string;
  firstname: string;
  middlename?: string;
  lastname: string;
  nickname?: string;
  email: string;
  phone: PhoneType;
  role: "admin" | "user";
  preference: PreferenceType;
  createdAt?: Date;
  updatedAt?: Date;
};

export const PhoneInputSchema = z
  .object({
    country_code: z.custom<CountryCode>(),
    value: z.string(),
  })
  .strict()
  .superRefine(({ value, country_code }, ctx) => {
    const number = parsePhoneNumberFromString(value, country_code);

    if (!number || !number.isValid()) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid mobile phone number",
        path: ["value"],
      });
      return;
    }

    const type = number.getType();

    if (type !== "MOBILE" && type !== "FIXED_LINE_OR_MOBILE") {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Phone number must be a mobile number",
      });
    }
  });

export const PhoneSchema = PhoneInputSchema.transform(({ value, country_code }) => {
  const number = parsePhoneNumberFromString(value, country_code)!;

  return {
    country_code,
    value,
    dial_code: `+${number.countryCallingCode}`,
    e164: number.number,
  };
});

const PreferenceSchema = z
  .object({
    preferredCurrency: z.string(),
    preferredDateFormat: z.enum(["dmy", "mdy", "ymd"]),
  })
  .strict();

export const AddUserSchema = z
  .object({
    username: z.string().min(4),
    password: z.string().min(8),
    firstname: z.string().min(2),
    middlename: z.string().min(2).optional(),
    lastname: z.string().min(2),
    nickname: z.string().optional(),
    email: z.email(),
    phone: PhoneInputSchema,
    role: z.enum(["admin", "user"]).optional(),
    preference: PreferenceSchema.optional(),
  })
  .strict();

export const UpdateUserSchema = z
  .object({
    username: z.string().min(4).optional(),
    firstname: z.string().min(2).optional(),
    middlename: z.string().min(2).optional(),
    lastname: z.string().min(2).optional(),
    nickname: z.string().optional(),
    email: z.email().optional(),
    phone: PhoneInputSchema.optional(),
    preference: PreferenceSchema.optional(),
  })
  .strict();

export const UpdatePasswordSchema = z
  .object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
  })
  .strict();

export const DeleteMeSchema = z.object({
  password: z.string(),
});

export type PhoneType = z.output<typeof PhoneSchema>;

export type PreferenceType = {
  preferredCurrency: string;
  preferredDateFormat: "dmy" | "mdy" | "ymd";
};

export type CreateUserPayload = z.infer<typeof AddUserSchema>;

export type UpdateUserPayload = z.infer<typeof UpdateUserSchema>;

export type UpdatePasswordPayload = z.infer<typeof UpdatePasswordSchema>;

export type DeleteMePayload = z.infer<typeof DeleteMeSchema>;

export type UserDTOType = Omit<UserType, "password"> & { password?: never };
