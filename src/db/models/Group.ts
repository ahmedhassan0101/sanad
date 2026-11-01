// مجموعة تعليمية: نشاط واحد + فرع واحد + معلم اختياري — النشاط والفرع لا يتغيران بعد الإنشاء.
import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  type Types,
} from "mongoose";

import { STATUS, type OptionKey } from "@/constants";

export type GroupStatus = OptionKey<typeof STATUS>;

export interface GroupDoc extends Document {
  orgId: Types.ObjectId;
  branchId: Types.ObjectId;
  activityKey: string;
  name: string;
  scheduleText: string | null;
  teacherId: Types.ObjectId | null;
  notes: string | null;
  status: GroupStatus;
  archivedAt: Date | null;
  createdAt: Date;
}

const groupSchema = new Schema<GroupDoc>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    activityKey: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    scheduleText: { type: String, trim: true, maxLength: 100, default: null },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", default: null },
    notes: { type: String, trim: true, default: null },
    status: { type: String, enum: STATUS.values, default: "active" },
    archivedAt: { type: Date, default: null },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

groupSchema.index(
  { orgId: 1, branchId: 1, activityKey: 1, name: 1 },
  { unique: true },
);
groupSchema.index({ orgId: 1, status: 1 });
groupSchema.index({ orgId: 1, activityKey: 1 });
groupSchema.index({ orgId: 1, branchId: 1, status: 1 });
groupSchema.index({ orgId: 1, teacherId: 1 });

export const Group: Model<GroupDoc> =
  (models.Group as Model<GroupDoc> | undefined) ??
  model<GroupDoc>("Group", groupSchema);
