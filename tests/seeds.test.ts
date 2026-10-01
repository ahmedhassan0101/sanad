import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { __resetEnvCache } from "@/lib/env";
import { User } from "@/db/models/User";

let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  replSet = await startMemoryDB();
});

afterAll(async () => {
  await stopMemoryDB(replSet);
});

beforeEach(async () => {
  await clearDB();
  vi.resetModules();
});

describe("seeds", () => {
  it("seed-super-admin is idempotent", async () => {
    process.env.SEED_SUPER_ADMIN_EMAIL = "root@example.com";
    process.env.SEED_SUPER_ADMIN_PASSWORD = "long-enough-password";
    __resetEnvCache();
    const { seedSuperAdmin } = await import("../scripts/seed-super-admin");
    await seedSuperAdmin();
    await seedSuperAdmin();
    expect(await User.countDocuments({ email: "root@example.com" })).toBe(1);
    const found = await User.findOne({ email: "root@example.com" });
    expect(found?.isPlatformAdmin).toBe(true);
  });

  it("seed-dev refuses production without ALLOW_DEV_SEED", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MONGODB_URI_PROD", "mongodb://127.0.0.1:27017/refused");
    vi.stubEnv("INVITE_CODE_PEPPER", "test-pepper-0123456789abcdef01234567");
    vi.stubEnv("ALLOW_DEV_SEED", "");
    __resetEnvCache();
    const { seedDev } = await import("../scripts/seed-dev");
    await expect(seedDev()).rejects.toThrow(/refuses production/);
    vi.unstubAllEnvs();
    __resetEnvCache();
  });
});
