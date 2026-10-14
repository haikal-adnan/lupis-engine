import { defineConfig, devices } from '@playwright/test';

const chromiumUse = {
  ...devices['Desktop Chrome'],
  launchOptions: {
    args: [
      '--use-gl=angle',
      '--use-angle=gl',
      '--ignore-gpu-blocklist',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--unsafely-treat-insecure-origin-as-secure=http://editor:6500,http://localhost:6500',
    ],
  },
};

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // GLOBAL timeouts (Standard Section 2 & 13). Never override per locator; for a test
  // that is genuinely slow use test.slow() once at its start, with a comment explaining why.
  timeout: 30_000,
  expect: { timeout: 15_000 },
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:6500',
    actionTimeout: 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      // Helper contract tests (Section 11.3). They run first: a helper failure stops
      // the feature specs early instead of scattering failures across the suite.
      name: 'contract',
      testMatch: '**/contract/**/*.spec.js',
      use: chromiumUse,
    },
    {
      // Feature specs. For fast iteration without the contract project:
      //   npx playwright test --project=chromium --no-deps
      name: 'chromium',
      testIgnore: ['**/contract/**', '**/specs/blueprint/**'],
      dependencies: ['contract'],
      use: chromiumUse,
    },
    {
      // Blueprint runtime specs: each test builds a graph, boots the WebGL preview popup
      // and waits for engine logs, which is slower than a regular UI test. Instead of
      // per-call { timeout } overrides (Section 2) the slower budget lives here, in the
      // project config, so it applies uniformly to every spec of this folder.
      name: 'blueprint',
      testMatch: '**/specs/blueprint/**/*.spec.js',
      dependencies: ['contract'],
      timeout: 90_000,
      expect: { timeout: 30_000 },
      use: chromiumUse,
    },
  ],
});
