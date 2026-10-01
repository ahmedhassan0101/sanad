import { connectDB } from "@/db/connection";
import { User } from "@/db/models/User";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { getEnv } from "@/lib/env";
import mongoose from "mongoose";

// Dev-only fixture: two isolated orgs for isolation tests.
// Refuses production unless ALLOW_DEV_SEED=true is set explicitly.
export async function seedDev() {
  const env = getEnv();
  if (env.nodeEnv === "production" && !env.allowDevSeed) {
    throw new Error("seed-dev refuses production without ALLOW_DEV_SEED=true");
  }
  await connectDB();
  async function makeOrg(orgName: string, branchName: string, adminEmail: string) {
    const admin = await User.create({ name: `${orgName} admin`, email: adminEmail });
    const org = await Org.create({
      name: orgName,
      contactPhone: "01000000000",
      createdByUserId: admin._id,
    });
    const branch = await Branch.create({ orgId: org._id, name: branchName });
    await Membership.create({
      userId: admin._id,
      orgId: org._id,
      role: "center_admin",
      branchIds: [],
      invitedByUserId: admin._id,
    });
    return { admin, org, branch };
  }
  const a = await makeOrg("Dev Org A", "Main", "deva@example.com");
  const b = await makeOrg("Dev Org B", "Main", "devb@example.com");
  return { a, b };
}

if (process.argv[1]?.endsWith("seed-dev.ts")) {
  await seedDev();
  await mongoose.disconnect();
}
