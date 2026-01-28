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
  keyValue: Record<string, any>;

  constructor(status: number, message: string, code: string, keyValue: Record<string, any>) {
    super(status, message, code);
    this.keyValue = keyValue;
    this.name = "FieldError";

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const LABELS: Record<string, string> = {
  "phone.e164": "Phone number",
  "otherPhones.e164": "Phone number",
  email: "Email",
  username: "Username",
};

const prettifyField = (field: string) => {
  return LABELS[field] || field.split(".").pop() || field;
};

const cleanKeyValue = (keyValue: Record<string, any>): Record<string, any> => {
  const newKeyValue: Record<string, any> = {};

  for (const key in keyValue) {
    if (key === "userId" || key === "_id") continue;

    if (Object.prototype.hasOwnProperty.call(keyValue, key)) {
      const cleanedKey = key.split(".")[0];
      newKeyValue[cleanedKey] = keyValue[key];
    }
  }

  return newKeyValue;
};

export const handleMongoDuplicateError = (error: unknown): never => {
  if (error instanceof Error && error.name === "MongoServerError") {
    const mongoError = error as any;

    if (mongoError.code === 11000 || mongoError.code === "11000") {
      const { keyValue } = mongoError;

      const filteredKeys = Object.keys(keyValue).filter((k) => k !== "userId" && k !== "_id");

      const field = filteredKeys.length > 0 ? filteredKeys[0] : Object.keys(keyValue)[0];
      // index collection like { userId: 1, "phone.e164": 1} will return keyValue: {userId: value, phone.e164: value}
      // remove userId or _id at the filteredKeys iteration.
      // get the first key after userId or _id

      const fieldLabel = prettifyField(field);

      const keyVal = cleanKeyValue(keyValue);

      throw new FieldError(409, `${fieldLabel} is already taken.`, "DUPLICATE_ENTRY", keyVal);
    }
  }

  throw error;
};
