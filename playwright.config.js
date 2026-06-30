// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const SITE_URL = process.env.SITE_URL || 'https://caramelcake.vercel.app';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  // Directory where test files are located
  testDir: './tests',

  // Run all tests in parallel for speed
  fullyParallel: true,

  // Fail the build if you accidentally left test.only in source
  forbidOnly: !!process.env.CI,

  // Retry failed tests once on CI (catches flaky network issues)
  retries: process.env.CI ? 1 : 0,

  // Use fewer workers on CI to avoid rate limiting external APIs
  workers: process.env.CI ? 2 : undefined,

  // Reporter: GitHub-native summary + HTML report with screenshots
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['html', { open: 'on-failure' }]],

  use: {
    // Base URL for all tests
    baseURL: SITE_URL,

    // Collect trace & video only on failure (for debugging)
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',

    // Browser settings
    headless: true,
    viewport: { width: 1280, height: 720 },

    // Wait up to 10s for navigation
    navigationTimeout: 10_000,

    // Wait up to 5s for assertions
    actionTimeout: 5_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to also test Firefox:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],

  // Maximum time for each test (60 seconds)
  timeout: 60_000,

  // Maximum time for the entire test suite (10 minutes)
  globalTimeout: 600_000,
});
