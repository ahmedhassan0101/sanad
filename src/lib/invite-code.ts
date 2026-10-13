import { createHmac, randomBytes } from "node:crypto";

// Invite codes: Crockford Base32 (no 0/O, 1/I/L confusion), 8 chars (~40 bits).
// ~40 bits can be brute-forced offline if the DB leaks, so we store only
// HMAC-SHA256(code, pepper). The pepper lives in env, never in the DB.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function normalizeInviteCode(raw: string): string {
  return raw.toUpperCase().replace(/[-\s]/g, "");
}

export function generateInviteCode(): string {
  return generateCode(8);
}

// مولّد عام بأي طول (يُستخدم لكود ولي الأمر: 10 حروف).
export function generateCode(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export function hashInviteCode(code: string, pepper: string): string {
  if (!pepper) throw new Error("Invite pepper is required");
  return createHmac("sha256", pepper).update(normalizeInviteCode(code)).digest("hex");
}
