import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list']
  ],
  use: {
    // Default ke localhost agar UI mode di komputer lokal langsung jalan
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:6500',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--use-gl=angle',
            '--use-angle=gl',
            '--ignore-gpu-blocklist',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            // Izinkan baik editor maupun localhost sebagai Secure Context
            '--unsafely-treat-insecure-origin-as-secure=http://editor:6500,http://localhost:6500'
          ]
        }
      },
    },
  ],
});