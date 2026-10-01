# Tools pinned in 2.0 — why each one

- **Vitest**: test runner for isolation and role tests. Reason: faster than Jest, native ESM support, minimal config with Next. Rejected: Jest (slower, heavier setup).
- **ESLint**: enforces the DB boundary rule (models only from services/scripts/tests). Reason: manual tenant isolation fails silently if bypassed; lint makes bypass a build error. Rejected: no lint (relies on discipline alone).
- **mongodb-memory-server**: ephemeral Mongo replica set for tests. Reason: real transactions support in CI/tests without a shared cluster, isolated per run. Rejected: shared Atlas for tests (quota risk, data leaks between runs, 0.5GB limit).
- **bcryptjs** (deferred to 2.1 with seed): password hashing. Reason: pure-JS, no native build issues on Vercel/Windows. Rejected: bcrypt native (build pain), argon2 (stronger but native + complex setup for this stage).
- **typescript-eslint**: TS parser for the lint boundary rule. Reason: base ESLint cannot parse TS/TSX, so the boundary rule would fail the build. No alternative.
