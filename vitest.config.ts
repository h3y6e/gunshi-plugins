import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            "@h3y6e/gunshi-plugin-env": fileURLToPath(
              new URL("packages/env/src/index.ts", import.meta.url),
            ),
          },
        },
        test: { name: "unit", include: ["packages/*/src/**/*.test.ts"] },
      },
      { test: { name: "fidelity", include: ["fidelity/*/**/*.test.ts"], testTimeout: 60_000 } },
      { test: { name: "e2e", include: ["examples/**/*.e2e.test.ts"], testTimeout: 60_000 } },
    ],
  },
});
