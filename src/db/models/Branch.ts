import { type OptionKey, STATUS } from "@/constants";
import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  type Types,
} from "mongoose";

export type BranchStatus = OptionKey<typeof STATUS>; // "active" | "archived"

export interface BranchDoc extends Document {
  orgId: Types.ObjectId;
  name: string;
  status: BranchStatus;
}

const branchSchema = new Schema<BranchDoc>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: STATUS.values, default: "active" },
  },
  { timestamps: true },
);

branchSchema.index({ orgId: 1, name: 1 }, { unique: true });
branchSchema.index({ orgId: 1, status: 1 });

export const Branch: Model<BranchDoc> =
  (models.Branch as Model<BranchDoc> | undefined) ??
  model<BranchDoc>("Branch", branchSchema);
