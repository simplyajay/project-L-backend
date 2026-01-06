import mongoose, { Schema, Model } from "mongoose";
import { ICredit, ICreditHistory, ISettlement } from "./credit";

const SettlementSchema = new Schema<ISettlement>(
  {
    settlementAmount: { type: Number, required: true },
    interestAmount: { type: Number, required: true },
    settlementDate: { type: Date, required: true },
  },
  { timestamps: true }
);

const HistorySchema = new Schema<ICreditHistory>(
  {
    type: { type: String, required: true },
    date: { type: Date, required: true },
    note: { type: String, required: true },
  },
  { timestamps: true }
);

const CreditSchema = new Schema<ICredit>(
  {
    clientId: { type: Schema.Types.ObjectId, required: true },
    principalAmount: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    currentInterestAmount: { type: Number, required: true },
    balance: { type: Number, required: true },
    creditDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    settlements: { type: [SettlementSchema], default: [] },
    history: { type: [HistorySchema], default: [] },
  },
  { timestamps: true }
);

CreditSchema.index({ clientId: 1 });

const CreditModel: Model<ICredit> = mongoose.model<ICredit>("Credit", CreditSchema);
export default CreditModel;
