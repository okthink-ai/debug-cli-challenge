import { defineConfig } from '@playwright/test';

// Dedicated ports and database: tests never reset the app someone is presenting.
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  timeout: 45000,
  expect: { timeout: 15000 },
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8089',
    viewport: { width: 1200, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'node server/index.mjs',
      url: 'http://127.0.0.1:4311/health',
      env: {
        DEMO_API_PORT: '4311',
        DEMO_API_HOST: '127.0.0.1',
        DEMO_DB: '.data/browser-tests.sqlite',
      },
      reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 2000 },
    },
    {
      command: 'node node_modules/expo/bin/cli start --web --port 8089',
      url: 'http://localhost:8089',
      env: {
        CI: '1',
        BROWSER: 'none',
        EXPO_NO_DOTENV: '1',
        EXPO_PUBLIC_API_URL: 'http://127.0.0.1:4311',
      },
      timeout: 120000,
      reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 2000 },
    },
  ],
});
