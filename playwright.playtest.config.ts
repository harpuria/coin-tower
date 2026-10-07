import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playtest',
  outputDir: './test-results/touch-playtest',
  workers: 1,
  retries: 0,
  timeout: 120_000,
  use: {
    baseURL: 'http://127.0.0.1:4175',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'touch-360',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 360, height: 640 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'touch-390',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: !process.env.CI,
  },
});
