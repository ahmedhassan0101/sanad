import bcrypt from "bcryptjs";
import { connectDB } from "@/db/connection";
import { User } from "@/db/models/User";
import { getEnv } from "@/lib/env";
import mongoose from "mongoose";

// Idempotent: repeated runs never duplicate the platform admin.
export async function seedSuperAdmin() {
  const env = getEnv();
  const email = env.seedSuperAdminEmail?.toLowerCase().trim();
  const password = env.seedSuperAdminPassword;
  if (!email || !password) {
    throw new Error("SEED_SUPER_ADMIN_EMAIL and SEED_SUPER_ADMIN_PASSWORD are required");
  }
  await connectDB();
  const existing = await User.findOne({ email }).select("+passwordHash");
  const passwordHash = await bcrypt.hash(password, 12);
  if (existing) {
    existing.isPlatformAdmin = true;
    existing.status = "active";
    existing.passwordHash = passwordHash;
    await existing.save();
    return existing;
  }
  return User.create({
    name: "Platform Admin",
    email,
    emailVerifiedAt: new Date(),
    passwordHash,
    isPlatformAdmin: true,
  });
}

if (process.argv[1]?.endsWith("seed-super-admin.ts")) {
  await seedSuperAdmin();
  await mongoose.disconnect();
}
