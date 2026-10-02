// حسابات الدخول: إنشاء حساب، تفعيل إيميل، نسيان واستعادة الباسورد.
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/db/connection";
import { User } from "@/db/models/User";
import { VerificationToken } from "@/db/models/VerificationToken";
import { sendAuthLink } from "@/lib/email/dev-logger";
import { getEnv } from "@/lib/env";

async function issueToken(email: string, type: "verify-email" | "reset-password", hours: number) {
  const token = randomBytes(32).toString("hex");
  await VerificationToken.create({
    identifier: email,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    type,
    expiresAt: new Date(Date.now() + hours * 3600_000),
  });
  return token;
}

export async function registerAccount(name: string, emailRaw: string, password: string) {
  const email = emailRaw.toLowerCase().trim();
  if (name.trim().length < 2 || password.length < 8) throw new Error("VALIDATION");
  await connectDB();
  if (await User.findOne({ email })) throw new Error("TAKEN");
  await User.create({ name: name.trim(), email, passwordHash: await bcrypt.hash(password, 12) });
  const token = await issueToken(email, "verify-email", 24);
  const env = getEnv();
  await sendAuthLink(
    email,
    `${env.authUrl}/verify?email=${encodeURIComponent(email)}&token=${token}`,
    "تفعيل حسابك"
  );
}

export async function verifyEmailToken(emailRaw: string, token: string) {
  const email = emailRaw.toLowerCase();
  await connectDB();
  const found = await VerificationToken.findOne({
    identifier: email,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    type: "verify-email",
    expiresAt: { $gt: new Date() },
  });
  if (!found) return false;
  await User.updateOne({ email }, { $set: { emailVerifiedAt: new Date() } });
  await VerificationToken.deleteOne({ _id: found._id });
  return true;
}

export async function requestPasswordReset(emailRaw: string) {
  const email = emailRaw.toLowerCase().trim();
  await connectDB();
  if (await User.findOne({ email })) {
    const token = await issueToken(email, "reset-password", 2);
    const env = getEnv();
    await sendAuthLink(
      email,
      `${env.authUrl}/reset?email=${encodeURIComponent(email)}&token=${token}`,
      "تعيين كلمة مرور جديدة"
    );
  }
}

export async function resetPassword(emailRaw: string, token: string, password: string) {
  if (password.length < 8) throw new Error("VALIDATION");
  const email = emailRaw.toLowerCase();
  await connectDB();
  const found = await VerificationToken.findOne({
    identifier: email,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    type: "reset-password",
    expiresAt: { $gt: new Date() },
  });
  if (!found) throw new Error("EXPIRED");
  await User.updateOne(
    { email },
    { $set: { passwordHash: await bcrypt.hash(password, 12) }, $inc: { sessionVersion: 1 } }
  );
  await VerificationToken.deleteOne({ _id: found._id });
}

export async function verifyCredentials(emailRaw: string, password: string) {
  await connectDB();
  const user = await User.findOne({ email: emailRaw.toLowerCase().trim() }).select("+passwordHash");
  if (!user || user.status !== "active" || !user.passwordHash) return null;
  if (!(await bcrypt.compare(password, user.passwordHash))) return null;
  return { id: String(user._id), name: user.name, email: user.email };
}

export async function ensureGoogleUser(profile: {
  email?: string | null;
  name?: string | null;
  image?: string | null;
}) {
  const email = profile.email?.toLowerCase().trim();
  if (!email) return false;
  await connectDB();
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.status !== "active") return false;
    if (!existing.emailVerifiedAt) {
      existing.emailVerifiedAt = new Date();
      await existing.save();
    }
    return true;
  }
  await User.create({
    name: profile.name ?? email,
    email,
    emailVerifiedAt: new Date(),
    image: profile.image ?? null,
  });
  return true;
}
