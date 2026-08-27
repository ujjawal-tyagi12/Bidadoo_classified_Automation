import { defineConfig, devices } from "@playwright/test";
import { defineBddProject } from "playwright-bdd";
import { ENV } from "./env.js";

const env = ENV;
const isCI = !!process.env.CI;

const bddSteps = [
  "tests/ui/support/**/*.ts",
  "tests/ui/step-definitions/**/*.ts",
] as const;

const bddProject = defineBddProject({
  name: "bdd",
  features: "tests/ui/features/web/**/*.feature",
  steps: [...bddSteps],
});

const bddMsiteProject = defineBddProject({
  name: "bdd-msite",
  features: "tests/ui/features/msite/**/*.feature",
  steps: [...bddSteps],
});

/**
 * Cross-browser coverage for the Equipment Listing module (TC27 — "Web
 * Testing: Cross-Browser Compatibility"). Scoped to just this one feature
 * file, not the whole bdd suite, since that's the test case's actual scope.
 * Firefox and WebKit are already installed locally (confirmed via
 * `npx playwright install --dry-run firefox webkit`), so no new download is
 * needed to run these.
 */
const bddEquipmentListingCrossBrowserProject = defineBddProject({
  name: "bdd-equipment-listing-cross-browser",
  features: "tests/ui/features/web/equipment-listing.feature",
  steps: [...bddSteps],
});

export default defineConfig({
  globalSetup: "./config/test-run-log-global-setup.ts",
  globalTeardown: "./config/test-run-log-global-teardown.ts",

  testDir: "./tests",

  fullyParallel: true,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,

  timeout: 40000,

  expect: {
    timeout: 20000,
  },

  reporter: isCI
    ? [
        ["html"],
        ["allure-playwright", { outputFolder: "allure-results" }],
        ["list"],
      ]
    : [
        ["html", { outputFolder: "reports/html" }],
        ["allure-playwright", { outputFolder: "allure-results" }],
        ["list"],
      ],

  use: {
    baseURL: env.BASE_URL,
    actionTimeout: 15000,
    navigationTimeout: 30000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: true,
    viewport: isCI ? { width: 1920, height: 1080 } : null,
    launchOptions: {
      args: isCI ? [] : ["--start-maximized"],
    },
  },

  outputDir: "test-results",

  projects: [
    {
      name: "api",
      testMatch: ["**/tests/api/**/*.spec.ts"],
      use: {
        baseURL: env.API_URL,
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "chromium",
      testMatch: ["**/tests/ui/**/*.spec.ts"],
      use: {
        ...devices["Desktop Chrome"],
        uiSurface: "desktop",
        // Always a concrete desktop size — `null` here previously let a
        // headless local run fall back to Chromium's small headless default
        // viewport (below this app's responsive breakpoints), silently
        // flipping the sidebar filter panel into its mobile/tablet overlay
        // layout instead of the desktop project's intended always-visible
        // sidebar (confirmed live while building the equipment-listing
        // module — see the build report for details).
        viewport: isCI ? { width: 1920, height: 1080 } : { width: 1280, height: 800 },
        deviceScaleFactor: undefined,
        launchOptions: {
          args: isCI ? [] : ["--start-maximized"],
        },
      },
    },
    {
      ...bddProject,
      grepInvert: /@msite\b/,
      use: {
        ...devices["Desktop Chrome"],
        uiSurface: "desktop",
        // Always a concrete desktop size — `null` here previously let a
        // headless local run fall back to Chromium's small headless default
        // viewport (below this app's responsive breakpoints), silently
        // flipping the sidebar filter panel into its mobile/tablet overlay
        // layout instead of the desktop project's intended always-visible
        // sidebar (confirmed live while building the equipment-listing
        // module — see the build report for details).
        viewport: isCI ? { width: 1920, height: 1080 } : { width: 1280, height: 800 },
        deviceScaleFactor: undefined,
        launchOptions: {
          args: isCI ? [] : ["--start-maximized"],
        },
      },
    },
    {
      ...bddMsiteProject,
      grep: /@msite\b/,
      use: {
        ...devices["Galaxy S24"],
        uiSurface: "msite",
        baseURL: env.MSITE_BASE_URL ?? env.BASE_URL,
        launchOptions: {
          args: [],
        },
      },
    },
    {
      ...bddEquipmentListingCrossBrowserProject,
      name: "bdd-equipment-listing-firefox",
      use: {
        ...devices["Desktop Firefox"],
        uiSurface: "desktop",
        viewport: isCI ? { width: 1920, height: 1080 } : { width: 1280, height: 800 },
      },
    },
    {
      ...bddEquipmentListingCrossBrowserProject,
      name: "bdd-equipment-listing-webkit",
      use: {
        ...devices["Desktop Safari"],
        uiSurface: "desktop",
        viewport: isCI ? { width: 1920, height: 1080 } : { width: 1280, height: 800 },
      },
    },
  ],
});
