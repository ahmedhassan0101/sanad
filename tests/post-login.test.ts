// قرار ما بعد الدخول: بلا عضويات/واحدة/متعددة + كوكي غير صالح.
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { User } from "@/db/models/User";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { resolvePostLogin } from "../services/org-selection";
import { getSessionContext } from "../services/session-context";

let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  replSet = await startMemoryDB();
});

afterAll(async () => {
  await stopMemoryDB(replSet);
});

beforeEach(clearDB);

async function makeUser(email: string, orgNames: string[]) {
  const user = await User.create({ name: "U", email, emailVerifiedAt: new Date() });
  for (const name of orgNames) {
    const org = await Org.create({ name, contactPhone: "01", createdByUserId: user._id });
    const branch = await Branch.create({ orgId: org._id, name: "B1" });
    await Membership.create({ userId: user._id, orgId: org._id, role: "center_admin" });
    void branch;
  }
  return user;
}

describe("resolvePostLogin", () => {
  it("no memberships → none", async () => {
    const u = await makeUser("none@t.test", []);
    expect(await resolvePostLogin(String(u._id))).toEqual({ kind: "none" });
  });

  it("single membership → single with orgId", async () => {
    const u = await makeUser("single@t.test", ["O1"]);
    const res = await resolvePostLogin(String(u._id));
    expect(res.kind).toBe("single");
    if (res.kind === "single") {
      const org = await Org.findOne({ name: "O1" });
      expect(res.orgId).toBe(String(org!._id));
    }
  });

  it("multiple memberships → many", async () => {
    const u = await makeUser("many@t.test", ["O1", "O2"]);
    expect(await resolvePostLogin(String(u._id))).toEqual({ kind: "many" });
  });

  it("invalid org cookie safely falls back to onboarding", async () => {
    const u = await makeUser("bad@t.test", ["O1"]);
    const ctx = await getSessionContext(String(u._id), "not-an-object-id");
    expect(ctx.kind).toBe("onboarding");
  });
});
