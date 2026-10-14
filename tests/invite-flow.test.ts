// تدفق الدعوة الكامل: إنشاء ← استخدام ← استخدام مكرر يفشل ← إلغاء ← مستبعدة.
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import { Types } from "mongoose";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { User } from "@/db/models/User";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { createInvite, consumeInvite, listInvites, revokeInvite } from "../services/invites";

let replSet: MongoMemoryReplSet;
let ids: { owner: Types.ObjectId; org: Types.ObjectId; b1: Types.ObjectId };
let newcomer: Types.ObjectId;

beforeAll(async () => {
  replSet = await startMemoryDB();
});

afterAll(async () => {
  await stopMemoryDB(replSet);
});

beforeEach(async () => {
  await clearDB();
  const verified = new Date();
  const owner = await User.create({ name: "O", email: "o@f.test", emailVerifiedAt: verified });
  const org = await Org.create({ name: "O", contactPhone: "01", createdByUserId: owner._id });
  const b1 = await Branch.create({ orgId: org._id, name: "B1" });
  await Membership.create({ userId: owner._id, orgId: org._id, role: "center_admin" });
  newcomer = (
    await User.create({ name: "N", email: "n@f.test", emailVerifiedAt: verified })
  )._id;
  ids = { owner: owner._id, org: org._id, b1: b1._id };
});

const granter = () => ({
  userId: String(ids.owner),
  orgId: ids.org,
  role: "center_admin" as const,
  branchIds: [] as Types.ObjectId[],
});

const ownerCtx = () => ({
  kind: "member" as const,
  userId: String(ids.owner),
  orgId: ids.org,
  role: "center_admin" as const,
  branchScope: { mode: "all" as const },
});

describe("invite lifecycle", () => {
  it("create → consume → second consume fails", async () => {
    const { code } = await createInvite(granter(), "supervisor", String(ids.b1), 2);
    const joined = await consumeInvite(String(newcomer), code);
    expect(joined.orgId).toBe(String(ids.org));
    await expect(consumeInvite(String(newcomer), code)).rejects.toThrow();
    expect(
      await Membership.countDocuments({ userId: newcomer, orgId: ids.org, status: "active" }),
    ).toBe(1);
  });

  it("revoked invite is excluded from list and cannot be consumed", async () => {
    const { code } = await createInvite(granter(), "supervisor", String(ids.b1), 2);
    const before = await listInvites(ownerCtx());
    const target = before.find((i) => i.id);
    await revokeInvite(ownerCtx(), target!.id);
    expect((await listInvites(ownerCtx())).some((i) => i.id === target!.id)).toBe(false);
    await expect(consumeInvite(String(newcomer), code)).rejects.toThrow();
  });
});
