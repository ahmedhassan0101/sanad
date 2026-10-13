import { z } from "zod";

// Validates environment at boot (called from instrumentation.ts, never from a page).
// Requirements depend on NODE_ENV:
// - production: MONGODB_URI_PROD + INVITE_CODE_PEPPER are required.
// - development: MONGODB_URI_DEV is required.
// - test: no URI required (mongodb-memory-server provides it).
const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI_DEV: z.string().optional(),
  MONGODB_URI_PROD: z.string().optional(),
  INVITE_CODE_PEPPER: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  AUTH_URL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  ALLOW_DEV_SEED: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  EMAIL_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  SEED_SUPER_ADMIN_EMAIL: z.string().optional(),
  SEED_SUPER_ADMIN_PASSWORD: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

export type Env = {
  nodeEnv: "development" | "test" | "production";
  mongoUri: string | null;
  inviteCodePepper: string | null;
  allowDevSeed: boolean;
  emailEnabled: boolean;
  seedSuperAdminEmail?: string;
  seedSuperAdminPassword?: string;
  authUrl: string;
};

let cached: Env | null = null;

// Test-only: env is cached for production speed; tests reset between cases.
export function __resetEnvCache() {
  cached = null;
}

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
  const inviteCodePepper: string | null = base.INVITE_CODE_PEPPER ?? null;
  if (base.NODE_ENV === "production") {
    if (!base.MONGODB_URI_PROD) {
      throw new Error("Invalid environment: MONGODB_URI_PROD is required in production");
    }
    if (!base.INVITE_CODE_PEPPER) {
      throw new Error("Invalid environment: INVITE_CODE_PEPPER is required in production");
    }
    if (base.INVITE_CODE_PEPPER.length < 32) {
      throw new Error("Invalid environment: INVITE_CODE_PEPPER must be at least 32 characters");
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
    inviteCodePepper,
    allowDevSeed: base.ALLOW_DEV_SEED ?? false,
    emailEnabled: base.EMAIL_ENABLED ?? false,
    seedSuperAdminEmail: base.SEED_SUPER_ADMIN_EMAIL,
    seedSuperAdminPassword: base.SEED_SUPER_ADMIN_PASSWORD,
    authUrl: base.AUTH_URL ?? "http://localhost:3000",
  };
  return cached;
}
