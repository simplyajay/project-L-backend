import { FieldError } from "../types/error";

export const handleMongoDuplicateError = (error: unknown): void => {
  if (error instanceof Error && error.name === "MongoServerError") {
    const mongoError = error as any;

    if (mongoError.code === 11000 || mongoError.code === "11000") {
      const { keyValue } = mongoError;
      const key = Object.keys(keyValue);
      const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
      throw new FieldError(
        409,
        `${capitalize(key[0])} is already taken.`,
        "DUPLICATE_ENTRY",
        keyValue
      );
    }

    //add another if for validation error ( missing required fields )
  }
};
