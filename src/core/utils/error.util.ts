const LABELS: Record<string, string> = {
  "phone.e164": "Phone number is already taken",
  "otherPhones.e164": "Phone number is already taken",
  email: "Email is already taken",
  username: "Username is already taken",
};

export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "AppError";

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class FieldError extends AppError {
  fieldErrors: FieldErrors;

  constructor(status: number, message: string, code: string, fieldErrors: FieldErrors) {
    super(status, message, code);
    this.fieldErrors = fieldErrors;
    this.name = "FieldError";

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const handleMongoDuplicateError = (error: unknown): never => {
  if (error instanceof Error && error.name === "MongoServerError") {
    const mongoError = error as any;

    if (mongoError.code === 11000 || mongoError.code === "11000") {
      const { keyValue } = mongoError;

      const fields = Object.keys(keyValue).filter((k) => k !== "userId" && k !== "_id");

      const errorFields: FieldErrors = {};

      fields.forEach((f) => {
        errorFields[f] = [LABELS[f] ?? `${f} is already taken.`];
      });

      throw new FieldError(409, `Duplicate field value`, "DUPLICATE_ENTRY", errorFields);
    }
  }

  throw error;
};
