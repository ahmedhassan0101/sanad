import { Schema, model, models, type Document, type Model } from "mongoose";

// روابط لمرة واحدة: تأكيد إيميل أو تعيين باسورد — تُحذف عند انتهائها.
export type TokenType = "verify-email" | "reset-password";

export interface VerificationTokenDoc extends Document {
  identifier: string;
  tokenHash: string;
  type: TokenType;
  expiresAt: Date;
}

const verificationTokenSchema = new Schema<VerificationTokenDoc>({
  identifier: { type: String, required: true, lowercase: true, trim: true },
  tokenHash: { type: String, required: true, unique: true },
  type: { type: String, enum: ["verify-email", "reset-password"], required: true },
  expiresAt: { type: Date, required: true },
});

verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const VerificationToken: Model<VerificationTokenDoc> =
  (models.VerificationToken as Model<VerificationTokenDoc> | undefined) ??
  model<VerificationTokenDoc>("VerificationToken", verificationTokenSchema);
