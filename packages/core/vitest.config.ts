import { defineConfig } from "vitest/config";

/**
 * Cobertura do Core — gate do CI (S3). Baseline 2026-10-17:
 * stmts 93.8 / branch 85.7 / funcs 94.3 / lines 93.8.
 * Thresholds abaixo do baseline dão folga sem mascarar regressão.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts"],
      thresholds: {
        statements: 90,
        lines: 90,
        functions: 90,
        branches: 80,
      },
    },
  },
});
