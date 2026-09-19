import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Deliberately mirrors only the parts of vite.config.ts that the test
// runner needs. The TanStack start/router plugins are excluded so route
// codegen and import-protection never run during tests.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      TZ: "UTC",
    },
  },
})
