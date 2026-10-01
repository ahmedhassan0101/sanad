import { z } from "zod";

// Validates environment at boot (called from instrumentation.ts, never from a page).
// Requirements depend on NODE_ENV:
// - production: MONGODB_URI_PROD is required.
// - development: MONGODB_URI_DEV is required.
// - test: no URI required (mongodb-memory-server provides it).
const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI_DEV: z.string().optional(),
  MONGODB_URI_PROD: z.string().optional(),
  EMAIL_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  SEED_SUPER_ADMIN_EMAIL: z.string().optional(),
  SEED_SUPER_ADMIN_PASSWORD: z.string().optional(),
});

export type Env = {
  nodeEnv: "development" | "test" | "production";
  mongoUri: string | null;
  emailEnabled: boolean;
  seedSuperAdminEmail?: string;
  seedSuperAdminPassword?: string;
};

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = baseSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${details}`);
  }
  const base = parsed.data;
  let mongoUri: string | null = null;
  if (base.NODE_ENV === "production") {
    if (!base.MONGODB_URI_PROD) {
      throw new Error("Invalid environment: MONGODB_URI_PROD is required in production");
    }
    mongoUri = base.MONGODB_URI_PROD;
  } else if (base.NODE_ENV === "development") {
    if (!base.MONGODB_URI_DEV) {
      throw new Error("Invalid environment: MONGODB_URI_DEV is required in development");
    }
    mongoUri = base.MONGODB_URI_DEV;
  }
  // test: memory server, no URI needed.
  cached = {
    nodeEnv: base.NODE_ENV,
    mongoUri,
    emailEnabled: base.EMAIL_ENABLED ?? false,
    seedSuperAdminEmail: base.SEED_SUPER_ADMIN_EMAIL,
    seedSuperAdminPassword: base.SEED_SUPER_ADMIN_PASSWORD,
  };
  return cached;
}
