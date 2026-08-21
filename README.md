
# Automation Framework (Playwright + TypeScript + BDD)

This repo is a **project-agnostic Playwright automation framework** (UI + API) with an optional BDD layer (`playwright-bdd`).

It intentionally contains only:
- reusable framework code under `core/`
- minimal configuration under `config/`
- a tiny example under `tests/` that demonstrates the pattern

---

## 1. Where you will write code

All scripting lives under `tests/`:

```
tests/
├── api/            # API tests (Playwright request)
└── ui/
    ├── specs/      # UI .spec.ts files (non‑BDD)
    ├── features/   # BDD .feature files (optional)
    ├── step-definitions/  # BDD step files (optional)
    └── support/    # UI fixtures/helpers (optional)
```

Day to day you work under `tests/`. You usually do **not** change `core/` or `config` unless you are modifying framework behaviour. For new flows, prefer creating pages/actions/fixtures under `tests/ui` (for example `tests/ui/pages`, `tests/ui/actions`, `tests/ui/support`). Use `domain/` only when you want shared library code reused by many tests or projects.

---

## 2. Configure base URLs

1. **Create your env file**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`** (project root) with your application URLs:
   ```env
   BASE_URL=http://your-app-host:3000        # UI & E2E tests
   API_URL=http://your-api-host:3000/api     # API tests
   # Optional: dedicated m-site host. If unset, m-site BDD uses BASE_URL (responsive-only).
   # MSITE_BASE_URL=https://m.your-app-host:3000
   ```

Playwright picks up `BASE_URL` and `API_URL` through `config/env.ts`, so in tests you can use relative paths like `/login`.

**M-site BDD:** Gherkin under `tests/ui/features/msite/` runs in the Playwright project `bdd-msite` (mobile device emulation, optional `MSITE_BASE_URL`). Desktop BDD uses `tests/ui/features/web/` and project `bdd`. Scenarios in `msite/` should carry the `@msite` tag so project-level selection stays explicit.

**Surface-aware locators (single source of truth):** Tests get a `uiSurface` fixture (`"desktop"` \| `"msite"`) from Playwright `use.uiSurface` in `config/playwright.config.ts` (with a fallback from the project name). `ActionDeps` passes the same value into page objects. **In `*Page` classes, define every named control with `surfaceLocator(name).desktop(p => ...).build(page, uiSurface)`** even when desktop and m-site match today: `.desktop` is the default on **all** surfaces until you add `.msite(p => ...)`, so a future m-site DOM change is an additive edit, not a migration from another page API. Use raw `el()` / `page.locator` only for ephemeral composition inside actions (e.g. `.nth()`, dynamic steps), not as the primary pattern for stable page elements. This repo automates web only; there is no Android/iOS Appium dimension unless you add a separate runner later.

---

## 3. Run tests

From the project root:

- **All tests (API + UI):**
  ```bash
  npm test
  ```
- **Only UI specs (`tests/ui/specs/*.spec.ts`):**
  ```bash
  npm run test:ui
  ```
- **Only API specs (`tests/api/*.spec.ts`):**
  ```bash
  npm run test:api
  ```
- **BDD features (desktop / `tests/ui/features/web/`):**
  ```bash
  npm run test:features
  ```
- **BDD m-site (`tests/ui/features/msite/`, device preset):**
  ```bash
  npm run test:features:msite
  ```
- **Headed UI (see browser):**
  ```bash
  npm run test:headed
  ```

**CI matrix (BDD):** After `npm run bddgen`, run two jobs in parallel when you want both surfaces: `playwright test --project=bdd` and `playwright test --project=bdd-msite`. Reuse the same environment; set `MSITE_BASE_URL` only when QA uses a separate m-host.

HTML reports live under `reports/html` and can be opened with:
```bash
npm run report
```

### Allure report

After a test run, Playwright writes raw results to **`reports/allure-results/`**. You need **Java 8+** on your PATH for the Allure CLI.

- **Generate static report** (output: `reports/allure/`) and open in browser:
  ```bash
  npm run report:allure
  ```
- **Or serve without generating files** (quick local view):
  ```bash
  npm run allure:serve
  ```

| Script | Purpose |
|--------|---------|
| `npm run allure:generate` | Build HTML from `reports/allure-results` → `reports/allure` |
| `npm run allure:open` | Open last generated `reports/allure` |
| `npm run allure:serve` | Live server from `reports/allure-results` (no separate generate step) |

In tests you can add metadata with `allure-playwright` (e.g. `label`, `description`, `attachment`).

---

## 4. Write an API test (inside `tests/api/`)

1. Create a file like `tests/api/users.spec.ts`.
2. Use Playwright's `request` fixture and your API clients if needed.

Example:

```ts
import { test, expect } from "@playwright/test";

// Simple API smoke test – customize for your API

test("create user", async ({ request }) => {
  const response = await request.post("/users", {
    data: { name: "Test", email: "[email protected]" },
  });

  expect(response.ok()).toBeTruthy();
});
```

Because the `api` project in `config/playwright.config.ts` uses `API_URL` as `baseURL`, `/users` goes to `API_URL + "/users"`.

---

## 5. Write a UI test (inside `tests/ui/specs/`)

1. Create a file like `tests/ui/specs/login.spec.ts`.
2. Import `test` and `expect` from `@playwright/test`.
3. Use page objects + actions (recommended) – create new files under `tests/ui/pages/` and `tests/ui/actions/`.

Minimal example:

```ts
import { test, expect } from "@playwright/test";

// Simple UI smoke test – replace "/" with your real path

test("home page has expected title", async ({ page }) => {
  await page.goto("/");            // uses BASE_URL from .env
  await expect(page).toHaveTitle(/Your App/i);
});
```

For larger flows, follow a Page Object Model similar to Playwright docs:

- Put page objects under `tests/ui/pages/` (e.g. `LoginPage.ts`).
- Put action/service classes under `tests/ui/actions/` (e.g. `LoginActions.ts`).
- Specs in `tests/ui/specs/` only call those actions.

This keeps everything needed for scripting **inside `tests/ui`**.

You can also share small element helpers globally in `core/utils/elementActions.ts` (imported via `@core/utils`). It wraps Playwright locators with simple functions like `click`, `fill`, `hover`, and `press` plus logging, so actions and steps can reuse the same patterns.

---

## 6. (Optional) BDD with Gherkin

If you want Given/When/Then:

1. **Feature file:** create `tests/ui/features/<name>.feature`.
2. **Step definitions:** create `tests/ui/step-definitions/<name>.steps.ts`.
3. Use `playwright-bdd`'s `createBdd()` with Playwright fixtures (no World). Example skeleton:

```ts
import { createBdd } from "playwright-bdd";
import { test } from "@playwright/test"; // or a custom test with fixtures

const { Given, When, Then } = createBdd(test);

Given("user is on login page", async ({ page }) => {
  await page.goto("/login");
});

When("user logs in", async ({ page }) => {
  // call your actions here
});

Then("dashboard is visible", async ({ page }) => {
  // assertions here
});
```

Then run:
```bash
npm run test:features
```

If you don't need BDD, you can ignore `features/` and `step-definitions/` and just use `specs/`.

---

## 7. What to touch vs. ignore

When scripting day to day, you mainly work with:

- `tests/api/**/*.spec.ts` – API tests.
- `tests/ui/specs/**/*.spec.ts` – UI tests.
- `tests/ui/features/**/*.feature` + `tests/ui/step-definitions/**/*.ts` – optional BDD.
- `data/testdata/*.json` – optional test data (project-specific).
- `.env` – environment URLs.

You generally **do not change**:

- `core/` – shared utilities, fixtures, logging, etc.
- `domain/` – API clients, models, and any shared UI page/actions you choose to reuse.
- `config/` – Playwright + env wiring.

This keeps the scripting surface small: stay under `tests/` and use the existing `config/env` + fixtures + wrappers.

