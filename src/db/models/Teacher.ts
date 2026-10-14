// معلم بلا حساب دخول — في فرع واحد ولا ينتقل.
import { Schema, model, models, type Document, type Model, type Types } from "mongoose";
import { TEACHER_STATUS } from "@/constants/teachers";

export interface TeacherImage {
  url: string;
  publicId: string;
}

export interface TeacherDoc extends Document {
  orgId: Types.ObjectId;
  branchId: Types.ObjectId;
  name: string;
  nameSearch: string;
  phone: string | null;
  notes: string | null;
  image: TeacherImage | null;
  status: string;
  archivedAt: Date | null;
}

const teacherSchema = new Schema<TeacherDoc>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    name: { type: String, required: true, trim: true },
    nameSearch: { type: String, required: true },
    phone: { type: String, default: null, trim: true },
    notes: { type: String, default: null, trim: true },
    image: {
      type: new Schema<TeacherImage>(
        {
          url: { type: String, required: true },
          publicId: { type: String, required: true },
        },
        { _id: false },
      ),
      default: null,
    },
    status: { type: String, default: "active", enum: [...TEACHER_STATUS.keys] },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

teacherSchema.index({ orgId: 1, branchId: 1, status: 1, createdAt: -1 });
teacherSchema.index({ orgId: 1, branchId: 1, nameSearch: 1 });

export const Teacher: Model<TeacherDoc> =
  (models.Teacher as Model<TeacherDoc> | undefined) ?? model<TeacherDoc>("Teacher", teacherSchema);
