import "server-only";
import { connectDB } from "@/db/connection";
import { RateLimit } from "@/db/models/RateLimit";

export async function checkRateLimit(
  key: string,
  windowMs: number,
  max: number,
  message: string,
) {
  await connectDB();
  const count = await RateLimit.countDocuments({
    key,
    createdAt: { $gt: new Date(Date.now() - windowMs) },
  });
  if (count >= max) throw new Error(message);
  await RateLimit.create({ key });
}
