// مجموعة تعليمية: برنامج واحد + فرع واحد + معلم اختياري — البرنامج والفرع لا يتغيران بعد الإنشاء.
import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface GroupDoc extends Document {
  orgId: Types.ObjectId;
  branchId: Types.ObjectId;
  programKey: string;
  name: string;
  scheduleText: string | null;
  teacherId: Types.ObjectId | null;
  notes: string | null;
  status: "active" | "archived";
  archivedAt: Date | null;
  createdAt: Date;
}

const groupSchema = new Schema<GroupDoc>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    programKey: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    scheduleText: { type: String, trim: true, maxLength: 100, default: null },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", default: null },
    notes: { type: String, trim: true, default: null },
    status: { type: String, enum: ["active", "archived"], default: "active" },
    archivedAt: { type: Date, default: null },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

groupSchema.index({ orgId: 1, branchId: 1, programKey: 1, name: 1 }, { unique: true });
groupSchema.index({ orgId: 1, status: 1 });
groupSchema.index({ orgId: 1, programKey: 1 });
groupSchema.index({ orgId: 1, branchId: 1, status: 1 });
groupSchema.index({ orgId: 1, teacherId: 1 });

export const Group: Model<GroupDoc> =
  (models.Group as Model<GroupDoc> | undefined) ?? model<GroupDoc>("Group", groupSchema);
