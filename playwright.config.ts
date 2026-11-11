import { defineConfig } from "@playwright/test";

/**
 * Browser regression tests (tests/e2e). They run against an already running PRODUCTION build:
 *
 *   npm run build && npm start        # in one terminal
 *   npm run test:e2e                  # in another (E2E_BASE_URL overrides http://localhost:3000)
 *
 * Real Chrome (channel "chrome") and real wheel/keyboard input, because smooth scrolling (Lenis),
 * sticky positioning and Radix scroll locks behave differently in emulated scrolling.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: 4,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
  },
});
