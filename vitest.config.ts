import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Alias workspace packages to their source so `pnpm test` runs against
 * TypeScript directly — no build step required, and tests always reflect
 * the latest source. Add an entry here whenever you add a package.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@labkit/core": fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url)),
    },
  },
  test: {
    include: ["packages/**/test/**/*.test.ts"],
  },
});
