import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface OrgDoc extends Document {
  name: string;
  contactPhone: string;
  contactEmail: string | null;
  addressText: string | null;
  // Bumped inside the same transaction as any admin-membership write so two
  // concurrent demotions conflict instead of both succeeding (write skew).
  adminsVersion: number;
  createdByUserId: Types.ObjectId;
}

const orgSchema = new Schema<OrgDoc>(
  {
    name: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    contactEmail: { type: String, default: null, lowercase: true, trim: true },
    addressText: { type: String, default: null, trim: true },
    adminsVersion: { type: Number, default: 0 },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Org: Model<OrgDoc> =
  (models.Org as Model<OrgDoc> | undefined) ?? model<OrgDoc>("Org", orgSchema);
