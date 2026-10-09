import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      { test: { name: "unit", include: ["packages/*/src/**/*.test.ts"] } },
      { test: { name: "fidelity", include: ["fidelity/*/**/*.test.ts"], testTimeout: 60_000 } },
      { test: { name: "e2e", include: ["examples/**/*.e2e.test.ts"], testTimeout: 60_000 } },
    ],
  },
});
