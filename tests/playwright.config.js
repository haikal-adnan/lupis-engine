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
      '--unsafely-treat-insecure-origin-as-secure=http://editor:37600,http://localhost:37600',
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
  timeout: process.env.CI ? 60_000 : 30_000,
  expect: { timeout: process.env.CI ? 30_000 : 20_000 },
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:37600',
    actionTimeout: process.env.CI ? 30_000 : 20_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node server.js',
      cwd: '../service',
      url: 'http://localhost:37602/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        DISABLE_DEVTOOLS: 'true',
      },
    },
    {
      command: 'npm run dev',
      cwd: '../editor',
      url: 'http://localhost:37600',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        DISABLE_DEVTOOLS: 'true',
      },
    },
  ],
  projects: [
    {
      // Helper contract tests (Section 11.3). Reserved for helper modifications,
      // urgent infrastructure testing, and finalization runs. Decoupled from feature
      // specs so daily check/development runs do not carry contract overhead.
      name: 'contract',
      testMatch: '**/contract/**/*.spec.js',
      use: chromiumUse,
    },
    {
      // Feature specs. Runs fast for routine checking without running contract.
      name: 'chromium',
      testIgnore: ['**/contract/**', '**/specs/blueprint/**'],
      use: chromiumUse,
    },
    {
      // Blueprint runtime specs: each test builds a graph, boots the WebGL preview popup
      // and waits for engine logs, which is slower than a regular UI test. Instead of
      // per-call { timeout } overrides (Section 2) the slower budget lives here, in the
      // project config, so it applies uniformly to every spec of this folder.
      name: 'blueprint',
      testMatch: '**/specs/blueprint/**/*.spec.js',
      timeout: 90_000,
      expect: { timeout: 30_000 },
      use: chromiumUse,
    },
  ],
});
