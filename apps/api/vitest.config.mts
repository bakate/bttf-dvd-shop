import { defineConfig } from "vitest/config";

export default defineConfig({
  // Vite's defaults swap `development` for `production` under NODE_ENV=production, and `#src/*` would then load a stale `dist/`.
  ssr: { resolve: { conditions: ["development"] } },
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      reportsDirectory: "./coverage",
      thresholds: {
        "src/modules/*/domain/**": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
