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
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:6500',
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
      name: 'chromium', // Running cepat TANPA mendahului test contract
      testIgnore: '**/contract/**',
      use: chromiumUse,
    },
    {
      name: 'chromium-with-contract', // Running OTOMATIS mengeksekusi contract lebih dulu
      testIgnore: '**/contract/**',
      dependencies: ['contract'],
      use: chromiumUse,
    },
  ],
});