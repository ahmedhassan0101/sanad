import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

// Program catalog: seeded keys (quran, tajweed, tarbiya, maqraa, sports).
// Custom programs use programKey = "custom:<slug>" so the unique index covers them too.
export interface OrgProgramDoc extends Document {
  orgId: Types.ObjectId;
  programKey: string;
  customName: string | null;
  isActive: boolean;
}

const orgProgramSchema = new Schema<OrgProgramDoc>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    programKey: { type: String, required: true, trim: true },
    customName: { type: String, default: null, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

orgProgramSchema.index({ orgId: 1, programKey: 1 }, { unique: true });

export const OrgProgram: Model<OrgProgramDoc> =
  (models.OrgProgram as Model<OrgProgramDoc> | undefined) ??
  model<OrgProgramDoc>("OrgProgram", orgProgramSchema);
