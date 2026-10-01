// instrumentation.ts
// Runs once at server boot (not during build, not in a page).
// Missing env fails loudly here instead of silently later.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getEnv } = await import("@/lib/env");
    getEnv();
  }
}
