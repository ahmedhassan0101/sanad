// TEMPORARY — deleted after. Unverify + resend real email for the live test.
import { readFileSync } from "node:fs";
for (const raw of readFileSync(".env", "utf8").split("\n")) {
  const line = raw.trim();
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && m[1] && !process.env[m[1]]) process.env[m[1]] = m[2] ?? "";
}
process.env.EMAIL_ENABLED = "true";
async function main() {
  const { resendVerification } = await import("../services/auth-accounts");
  const { User } = await import("../src/db/models/User");
  const { connectDB } = await import("../src/db/connection");
  await connectDB();
  const email = "ahmedhassan.allatif@gmail.com";
  await User.updateOne({ email }, { $set: { emailVerifiedAt: null } });
  await resendVerification((await User.findOne({ email }))!._id.toString());
  console.log("REAL-MAIL resent");
  const mongoose = await import("mongoose");
  await mongoose.default.disconnect();
}
main().catch((e) => {
  console.error("REAL-MAIL FAIL:", e.message);
  process.exit(1);
});
