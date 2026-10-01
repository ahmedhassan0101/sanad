import tseslint from "typescript-eslint";

// ESLint flat config.
// DB boundary rule: src/db/** may only be imported from
// services/**, scripts/**, tests/** (plus instrumentation-free lib is pure).
const config = tseslint.config(
  {
    ignores: ["node_modules/**", ".next/**", "next-env.d.ts"],
  },
  ...tseslint.configs.recommended,
  {
    files: [
      "src/app/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
      "src/lib/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/db",
                "**/db/*",
                "**/db/models*",
                "**/db/models/*",
                "@/db",
                "@/db/*",
              ],
              // lib/ may use DB *types* (import type) but never runtime values.
              allowTypeImports: true,
              message:
                "DB layer may only be imported from services/**, scripts/** or tests/**.",
            },
          ],
        },
      ],
    },
  }
);

export default config;
