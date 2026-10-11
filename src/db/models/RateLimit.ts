import { Schema, model, models, type Document, type Model } from "mongoose";

export interface RateLimitDoc extends Document {
  key: string;
}

// Counter store for serverless rate limits. Guards query by createdAt windows;
// TTL (24h) is hygiene only, so rule windows must stay within 24h.
const rateLimitSchema = new Schema<RateLimitDoc>(
  {
    key: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
rateLimitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
rateLimitSchema.index({ key: 1, createdAt: -1 });

export const RateLimit: Model<RateLimitDoc> =
  (models.RateLimit as Model<RateLimitDoc> | undefined) ??
  model<RateLimitDoc>("RateLimit", rateLimitSchema);
