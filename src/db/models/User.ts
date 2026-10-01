import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export type UserStatus = "active" | "disabled" | "deleted";

export interface UserDoc extends Document {
  name: string;
  email: string;
  emailVerifiedAt: Date | null;
  image: string | null;
  passwordHash: string | null;
  status: UserStatus;
  isPlatformAdmin: boolean;
  sessionVersion: number;
}

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailVerifiedAt: { type: Date, default: null },
    image: { type: String, default: null },
    passwordHash: { type: String, default: null, select: false },
    status: {
      type: String,
      enum: ["active", "disabled", "deleted"],
      default: "active",
    },
    isPlatformAdmin: { type: Boolean, default: false },
    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc> | undefined) ?? model<UserDoc>("User", userSchema);

export type { Types };
