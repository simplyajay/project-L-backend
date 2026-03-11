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
        message: "Invalid mobile number.",
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
    username: z.string("Username is required.").min(4, { error: "Username must be atleast 4 characters." }),
    password: z.string("Password is required.").min(8, { error: "Password must be atleast 8 characters." }),
    firstname: z.string("First name is required.").min(2, { error: "First name must be atleast 2 characters." }),
    middlename: z.string().min(2, { error: "Middle name must be atleast 2 characters." }).optional(),
    lastname: z.string("Last name is required.").min(2, { error: "Last name must be atleast 2 characters." }),
    nickname: z.string().optional(),
    email: z
      .string("Email is required.")
      .refine((val) => z.email().safeParse(val).success, { error: "Invalid email address" }),
    phone: PhoneInputSchema,
    role: z.enum(["admin", "user"]).optional(),
    preference: PreferenceSchema.optional(),
  })
  .strict();

export const UpdateUserSchema = z
  .object({
    username: z.string().min(4, { error: "Username must be atleast 4 characters." }).optional(),
    firstname: z.string().min(2, { error: "First name must be atleast 2 characters." }).optional(),
    middlename: z.string().min(2, { error: "Middle name must be atleast 2 characters." }).optional(),
    lastname: z.string().min(2, { error: "Last name must be atleast 2 characters." }).optional(),
    nickname: z.string().optional(),
    email: z
      .string("Email is required.")
      .refine((val) => z.email().safeParse(val).success, { error: "Invalid email address" }),
    phone: PhoneInputSchema.optional(),
    preference: PreferenceSchema.optional(),
  })
  .strict();

export const UpdatePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, { error: "Password must be atleast 8 characters." }),
    newPassword: z.string().min(8, { error: "Password must be atleast 8 characters." }),
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
