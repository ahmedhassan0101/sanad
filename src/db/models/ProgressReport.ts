// تقرير تقدم طالب: موضع إجباري + مراجعة وتجويد واتجاه يدوي — الإنجاز يُحسب عرضًا.
import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  type Types,
} from "mongoose";
import { PROGRESS_TRENDS, TAJWEED_RATINGS } from "@/constants";

export interface ReportPosition {
  surah: number;
  ayah: number;
}

export interface ProgressReportDoc extends Document {
  orgId: Types.ObjectId;
  branchId: Types.ObjectId;
  studentId: Types.ObjectId;
  reportDateKey: string;
  hifzPosition: ReportPosition;
  revisionPosition: ReportPosition | null;
  tajweedRating: string;
  trend: string;
  notes: string | null;
  createdByUserId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const positionSchema = new Schema<ReportPosition>(
  {
    surah: { type: Number, required: true, min: 1, max: 114 },
    ayah: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const progressReportSchema = new Schema<ProgressReportDoc>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    reportDateKey: { type: String, required: true },
    hifzPosition: { type: positionSchema, required: true },
    revisionPosition: { type: positionSchema, default: null },
    tajweedRating: {
      type: String,
      required: true,
      enum: [...TAJWEED_RATINGS.keys],
    },
    trend: { type: String, required: true, enum: [...PROGRESS_TRENDS.keys] },
    notes: { type: String, default: null, trim: true },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

progressReportSchema.index({
  orgId: 1,
  studentId: 1,
  reportDateKey: -1,
  createdAt: -1,
});
progressReportSchema.index({ orgId: 1, branchId: 1, reportDateKey: -1 });

export const ProgressReport: Model<ProgressReportDoc> =
  (models.ProgressReport as Model<ProgressReportDoc> | undefined) ??
  model<ProgressReportDoc>("ProgressReport", progressReportSchema);
