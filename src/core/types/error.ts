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
