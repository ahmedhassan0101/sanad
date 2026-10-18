// تسجيل طالب في مجموعة — قيود العزل والتكرار على مستوى المستند.
import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface EnrollmentDoc extends Document {
  orgId: Types.ObjectId;
  branchId: Types.ObjectId;
  studentId: Types.ObjectId;
  groupId: Types.ObjectId;
  programKey: string;
  status: "active" | "left";
  joinedAt: Date | null;
  leftAt: Date | null;
}

const enrollmentSchema = new Schema<EnrollmentDoc>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    programKey: { type: String, required: true, trim: true },
    status: { type: String, enum: ["active", "left"], default: "active" },
    joinedAt: { type: Date, default: null },
    leftAt: { type: Date, default: null },
  },
  { timestamps: true }
);

enrollmentSchema.index(
  { studentId: 1, groupId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);
enrollmentSchema.index({ orgId: 1, groupId: 1, status: 1 });
enrollmentSchema.index({ orgId: 1, studentId: 1, status: 1 });
enrollmentSchema.index({ orgId: 1, programKey: 1, status: 1 });

export const Enrollment: Model<EnrollmentDoc> =
  (models.Enrollment as Model<EnrollmentDoc> | undefined) ??
  model<EnrollmentDoc>("Enrollment", enrollmentSchema);
