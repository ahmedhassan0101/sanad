// حسابات الدخول: إنشاء حساب، تفعيل إيميل، نسيان واستعادة الباسورد.
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/db/connection";
import { User } from "@/db/models/User";
import { VerificationToken } from "@/db/models/VerificationToken";
import { sendAuthLink } from "@/lib/email/dev-logger";
import { getEnv } from "@/lib/env";
import { checkRateLimit } from "./rate-limit";

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

export async function sendVerificationEmail(emailRaw: string) {
  const email = emailRaw.toLowerCase().trim();
  await checkRateLimit(`verify:${email}`, 3600_000, 3, "RATE_LIMITED: أعد المحاولة بعد ساعة");
  await connectDB();
  const token = await issueToken(email, "verify-email", 24);
  const env = getEnv();
  await sendAuthLink(
    email,
    `${env.authUrl}/verify?email=${encodeURIComponent(email)}&token=${token}`,
    "تفعيل حسابك"
  );
}

export async function resendVerification(userId: string) {
  await connectDB();
  const user = await User.findById(userId).select("email emailVerifiedAt status");
  if (!user || user.status !== "active") throw new Error("UNAUTHENTICATED");
  if (user.emailVerifiedAt) throw new Error("ALREADY_VERIFIED");
  await sendVerificationEmail(user.email);
  return { email: user.email };
}

export async function registerAccount(name: string, emailRaw: string, password: string) {
  const email = emailRaw.toLowerCase().trim();
  if (name.trim().length < 2 || password.length < 8) throw new Error("VALIDATION");
  await connectDB();
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.emailVerifiedAt) throw new Error("TAKEN");
    // حجز الإيميل: غير المفعّل يُستبدل ويُعاد تفعيله بدل الرفض.
    existing.name = name.trim();
    existing.passwordHash = await bcrypt.hash(password, 12);
    await existing.save();
    await VerificationToken.deleteMany({ identifier: email, type: "verify-email" });
    await sendVerificationEmail(email);
    return;
  }
  await User.create({ name: name.trim(), email, passwordHash: await bcrypt.hash(password, 12) });
  await sendVerificationEmail(email);
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
  await checkRateLimit(`reset:${email}`, 3600_000, 3, "RATE_LIMITED");
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

export async function isEmailVerified(emailRaw: string) {
  await connectDB();
  const user = await User.findOne({ email: emailRaw.toLowerCase().trim() }).select("emailVerifiedAt");
  return !!user?.emailVerifiedAt;
}

export async function requireVerifiedUser(userId: string) {
  await connectDB();
  const user = await User.findById(userId).select("emailVerifiedAt status");
  if (!user || user.status !== "active" || !user.emailVerifiedAt) {
    throw new Error("UNVERIFIED: فعّل بريدك أولاً");
  }
  return user;
}

export async function verifyCredentials(emailRaw: string, password: string) {
  await connectDB();
  const user = await User.findOne({ email: emailRaw.toLowerCase().trim() }).select("+passwordHash");
  if (!user || user.status !== "active" || !user.passwordHash) return null;
  if (!(await bcrypt.compare(password, user.passwordHash))) return null;
  return { id: String(user._id), name: user.name, email: user.email, sessionVersion: user.sessionVersion };
}

export async function getSessionVersionByUserId(userId: string) {
  await connectDB();
  const user = await User.findById(userId).select("sessionVersion");
  return user ? user.sessionVersion : null;
}

export async function ensureGoogleUser(profile: {
  email?: string | null;
  name?: string | null;
  image?: string | null;
}) {
  const email = profile.email?.toLowerCase().trim();
  if (!email) return false;
  await connectDB();
  const existing = await User.findOne({ email }).select("+passwordHash");
  if (existing) {
    if (existing.status !== "active") return false;
    if (!existing.emailVerifiedAt) {
      existing.emailVerifiedAt = new Date();
      // منع الاستيلاء: تفعيل Google يمسح باسوردًا وُضع قبل التفعيل ويُبطل الجلسات.
      if (existing.passwordHash) {
        existing.passwordHash = null;
        existing.sessionVersion += 1;
      }
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
