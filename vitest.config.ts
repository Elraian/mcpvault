import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    // Pure-JS Argon2id at 64 MiB / t=3 takes ~5s; allow generous headroom.
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
