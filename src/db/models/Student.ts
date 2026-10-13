// طالب في فرع واحد لا ينتقل — الأنشطة تُحسب من المجموعات لاحقًا لا من هنا.
import { Schema, model, models, type Document, type Model, type Types } from "mongoose";
import {
  GENDERS,
  GUARDIAN_RELATIONS,
  LEVELS,
  STUDENT_STATUS,
} from "@/constants/students";

export interface GuardianEntry {
  relation: string;
  phone: string;
}

export interface QuranPosition {
  surah: number;
  ayah: number;
}

export interface StudentImage {
  url: string;
  publicId: string;
}

export interface StudentDoc extends Document {
  orgId: Types.ObjectId;
  branchId: Types.ObjectId;
  name: string;
  nameSearch: string;
  gender: string;
  level: string;
  birthDate: Date | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  image: StudentImage | null;
  guardians: GuardianEntry[];
  hifzStart: QuranPosition | null;
  hifzPosition: QuranPosition | null;
  status: string;
  archivedAt: Date | null;
  parentCode: string;
}

const quranPositionSchema = new Schema<QuranPosition>(
  {
    surah: { type: Number, required: true, min: 1, max: 114 },
    ayah: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const studentSchema = new Schema<StudentDoc>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    name: { type: String, required: true, trim: true },
    nameSearch: { type: String, required: true },
    gender: { type: String, required: true, enum: [...GENDERS.keys] },
    level: { type: String, default: "beginner", enum: [...LEVELS.keys] },
    birthDate: { type: Date, default: null },
    phone: { type: String, default: null, trim: true },
    address: { type: String, default: null, trim: true },
    notes: { type: String, default: null, trim: true },
    image: {
      type: new Schema<StudentImage>(
        {
          url: { type: String, required: true },
          publicId: { type: String, required: true },
        },
        { _id: false },
      ),
      default: null,
    },
    guardians: {
      type: [
        new Schema<GuardianEntry>(
          {
            relation: { type: String, required: true, enum: [...GUARDIAN_RELATIONS.keys] },
            phone: { type: String, required: true, trim: true },
          },
          { _id: false },
        ),
      ],
      default: [],
      validate: {
        validator: (v: GuardianEntry[]) => v.length <= 4,
        message: "4 أولياء كحد أقصى",
      },
    },
    hifzStart: { type: quranPositionSchema, default: null },
    hifzPosition: { type: quranPositionSchema, default: null },
    status: { type: String, default: "active", enum: [...STUDENT_STATUS.keys] },
    archivedAt: { type: Date, default: null },
    parentCode: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

studentSchema.index({ orgId: 1, branchId: 1, status: 1, createdAt: -1 });
studentSchema.index({ orgId: 1, branchId: 1, nameSearch: 1 });

export const Student: Model<StudentDoc> =
  (models.Student as Model<StudentDoc> | undefined) ?? model<StudentDoc>("Student", studentSchema);
