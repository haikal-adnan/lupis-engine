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
  // Timeout GLOBAL (Standar Section 2 & 13). Jangan override per-locator; untuk test
  // yang memang lambat gunakan test.slow() sekali di awal test beserta komentar alasannya.
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
      name: 'contract',
      testMatch: '**/contract/**/*.spec.js',
      use: chromiumUse,
    },
    {
      // Contract project dijalankan lebih dulu (Section 11.3). Kegagalan helper
      // menghentikan spec fitur lebih awal. Untuk iterasi cepat tanpa contract:
      //   npx playwright test --project=chromium --no-deps
      name: 'chromium',
      testIgnore: '**/contract/**',
      dependencies: ['contract'],
      use: chromiumUse,
    },
  ],
});