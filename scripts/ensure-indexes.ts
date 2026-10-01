// ensure-indexes.ts
import "server-only";
import { connectDB } from "@/db/connection";
import { User } from "@/db/models/User";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { Invite } from "@/db/models/Invite";
import { OrgProgram } from "@/db/models/OrgProgram";
import { AuditLog } from "@/db/models/AuditLog";
import { RateLimit } from "@/db/models/RateLimit";
import mongoose from "mongoose";

// Builds declared indexes without dropping anything (never syncIndexes here:
// it would drop hand-tuned indexes in production).
export async function ensureIndexes() {
  await connectDB();
  for (const m of [User, Org, Branch, Membership, Invite, OrgProgram, AuditLog, RateLimit]) {
    await m.createIndexes();
  }
}

if (process.argv[1]?.endsWith("ensure-indexes.ts")) {
  ensureIndexes()
    .then(() => mongoose.disconnect())
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
