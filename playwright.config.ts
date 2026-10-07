import { defineConfig, devices } from '@playwright/test';

const preview = process.env.E2E_PREVIEW === '1';
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results/standalone',
  fullyParallel: true,
  workers: 1,
  timeout: 45_000,
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: preview
      ? 'npm run preview -- --port 4173 --strictPort'
      : 'npm run dev -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
