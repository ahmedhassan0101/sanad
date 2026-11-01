import { Schema, model, models, type Document, type Model } from "mongoose";
import { TOKEN_TYPES, type OptionKey } from "@/constants";

// One-time links: email confirmation or password reset — deleted when expired.
export type TokenType = OptionKey<typeof TOKEN_TYPES>;
export interface VerificationTokenDoc extends Document {
  identifier: string;
  tokenHash: string;
  type: TokenType;
  expiresAt: Date;
}

const verificationTokenSchema = new Schema<VerificationTokenDoc>({
  identifier: { type: String, required: true, lowercase: true, trim: true },
  tokenHash: { type: String, required: true, unique: true },
  type: { type: String, enum: TOKEN_TYPES.values, required: true },
  expiresAt: { type: Date, required: true },
});

verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const VerificationToken: Model<VerificationTokenDoc> =
  (models.VerificationToken as Model<VerificationTokenDoc> | undefined) ??
  model<VerificationTokenDoc>("VerificationToken", verificationTokenSchema);
