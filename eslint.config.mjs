import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore generated / binary Supabase type files
    "types/supabase.ts",
    "types/supabase_new.ts",
  ]),
  // Project-level rule overrides
  {
    rules: {
      // Downgrade from error to warning — codebase uses `any` for Supabase/AI generics
      "@typescript-eslint/no-explicit-any": "warn",
      // Downgrade exhaustive-deps to warning so existing hooks aren't broken
      "react-hooks/exhaustive-deps": "warn",
      // Keep prefer-const as error (auto-fixable)
      "prefer-const": "error",
      // Keep unescaped entities as error
      "react/no-unescaped-entities": "error",
    },
  },
]);

export default eslintConfig;
