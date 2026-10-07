import { defineConfig, devices } from '@playwright/test';

const preview = process.env.E2E_PREVIEW === '1';
export default defineConfig({
  testDir: './tests/crazygames',
  outputDir: './test-results/crazygames',
  fullyParallel: true,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  use: { baseURL: 'http://127.0.0.1:4174', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1 },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: preview
      ? 'npm run preview -- --port 4174 --strictPort'
      : 'npm run dev:crazygames -- --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
  },
});
