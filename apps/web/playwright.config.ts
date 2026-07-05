import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:4300',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // API URL is intercepted via page.route() — the value just needs to be
    // a fixed URL so Playwright's route matchers can intercept it reliably.
    command: 'VITE_API_URL=http://localhost:9999/api pnpm vite --port 4300',
    url: 'http://localhost:4300',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
