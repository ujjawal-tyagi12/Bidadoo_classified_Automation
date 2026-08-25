---
name: playwright-bdd-automation
description: >-
  Automate BDD test scenarios in this Playwright framework. Use when creating new
  test modules, adding feature files, writing step definitions, building page objects,
  or action classes. Also use when the user says "automate", "add test", "new module",
  "new scenario", or references the 5-layer architecture.
---

# Playwright BDD Automation Skill

Generate test automation code following this framework's 5-layer architecture.

The UI layer is **object-oriented**: each element is a typed object that exposes
its own actions (`click`, `fill`, `check`, …) and assertions (`expect.toBeVisible`,
`expect.toHaveText`, …). There is **no procedural `ui.click(element)` layer** —
that was removed.

## Frontend-first (mandatory before any code)

For **every** feature you automate, inspect the actual application under test (its
source, if available locally, or the rendered DOM/network calls) before writing
locators. Do **not** assume one screen's markup, field set, validation messages, or
submit behaviour matches another — verify each screen independently, and only reuse
a shared Page Object/helper when the same underlying component genuinely renders
both screens.

Before writing pages, actions, or steps, confirm from the real app:

| Area | What to verify |
|------|----------------------------|
| **Screen shell** | Bespoke page vs shared layout component — locators differ |
| **Form fields** | Placeholders, labels, required vs optional, multi-select vs single, disabled/read-only |
| **Dropdowns** | Data source (API/static), option shape (label/value keys) |
| **Validation** | Exact error strings as rendered |
| **Submit** | Conditions that enable/disable the submit control |
| **Toasts / routes** | Success messages and post-submit navigation |
| **Listing** | Search placeholder, row identity field, status/edit affordances |

## Workflow: Adding a New Test Module

Follow this exact sequence. **Complete the frontend-first pass above first**, then inspect
existing test files in each folder to learn framework patterns (not UI assumptions).

1. **Page Object** → `tests/ui/pages/{Feature}Page.ts`
2. **Action Class** → `tests/ui/actions/{Feature}Actions.ts`
3. **Register fixture** → add to `tests/ui/support/action.fixture.ts`
4. **Step Definitions** → `tests/ui/step-definitions/{module}.steps.ts`
5. **Feature File** → `tests/ui/features/web/{module}.feature`
6. **Validate** → `npm run bddgen && npx tsc --noEmit && npm run lint:rules`

If the module needs test data from JSON:

7. **Test Data** → `data/testdata/{module}.json`
8. **Props Type** → `data/props/{module}.props.ts`
9. **Reader** → `data/readers/{module}.reader.ts`

If the module needs API integration:

10. **API Models** → `tests/api/restful/data/{module}.models.ts`
11. **API Client** → `tests/api/restful/clients/{module}.client.ts`
12. **Endpoint** → add to `tests/api/restful/endpoints.ts`

## Layer Rules

### Page Objects — typed Element getters only, no logic

Build every element via the `surfaceLocator` fluent builder. Pick the role that
matches the underlying control — it unlocks the role-specific methods (`fill`,
`check`, `selectOption`, `setFiles`). Omit the role for read-only elements
(labels, toasts, headings, table cells) — those default to `GenericElement` and
still expose `click`, `text`, `count`, `attribute`, `expect.*`.

```typescript
import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

export class FeaturePage extends BasePage {
  // Button — clickable control. Inherits click/hover from BaseElement.
  get submitButton() {
    return surfaceLocator("Submit button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Submit" }))
      .build(this.page, this.surface);
  }

  // TextInput — exposes fill / clear / clearAndFill / value() / press().
  get nameInput() {
    return surfaceLocator("Name input")
      .asTextInput()
      .desktop((p) => p.locator("input[name='name']"))
      .build(this.page, this.surface);
  }

  // Checkbox — exposes check / uncheck / isChecked / toggle.
  get acceptTerms() {
    return surfaceLocator("Accept terms")
      .asCheckbox()
      .desktop((p) => p.getByLabel(/accept terms/i))
      .build(this.page, this.surface);
  }

  // Dropdown — native <select>. Exposes selectOption.
  get countryDropdown() {
    return surfaceLocator("Country dropdown")
      .asDropdown()
      .desktop((p) => p.locator("select[name='country']"))
      .build(this.page, this.surface);
  }

  // FileInput — exposes setFiles.
  get avatarUpload() {
    return surfaceLocator("Avatar upload")
      .asFileInput()
      .desktop((p) => p.locator("input[type='file'][name='avatar']"))
      .build(this.page, this.surface);
  }

  // Generic element — no role needed for read-only / clickable spans.
  get pageHeading() {
    return surfaceLocator("Page heading")
      .desktop((p) => p.getByRole("heading", { level: 1 }))
      .build(this.page, this.surface);
  }

  // Parameterised locator for dynamic rows.
  rowByName(name: string) {
    return surfaceLocator(`Row: ${name}`)
      .desktop((p) => p.locator("table tbody tr", {
        has: p.locator(`text="${name}"`),
      }))
      .build(this.page, this.surface);
  }
}
```

**Rules for Pages:**
- No `if` / `switch` / `for` / `while` (enforced by `lint:rules`).
- No assertions — assertions live on the element (`element.expect.*`) called from Actions.
- No business logic — only locators.

### Action Classes — task-level business methods driven by elements

```typescript
import { BaseActions } from "./BaseActions.js"; // or a similar local base if present
import type { ActionDeps } from "../support/action-deps.js";
import { FeaturePage } from "../pages/FeaturePage.js";

export class FeatureActions {
  private readonly feature: FeaturePage;

  constructor(
    private readonly page: import("@playwright/test").Page,
    private readonly deps: ActionDeps,
  ) {
    this.feature = new FeaturePage(page, deps.uiSurface);
  }

  async submitName(name: string): Promise<void> {
    await this.feature.nameInput.clearAndFill(name);
    await this.feature.acceptTerms.check();
    await this.feature.submitButton.click();
    await this.feature.pageHeading.expect.toHaveText("Thanks");
  }

  async readHeading(): Promise<string> {
    return await this.feature.pageHeading.text();
  }
}
```

**Rules for Actions:**
- Drive UI **through elements** — `element.click()`, `element.clearAndFill(v)`, `element.check()`, `element.expect.toBeVisible()`, `element.text()`.
- Forbidden: `this.ui.click()`, `this.assert.visible()`, `this.read.count()` — those classes were removed.
- Page-/context-level helpers stay on `deps`:
  - `deps.nav.goto(...)`, `deps.nav.reload(...)`, `deps.nav.waitForURL(...)`
  - `deps.pageAssert.urlContains(...)`, `deps.pageAssert.titleIs(...)`
  - `deps.request` for API calls (typed clients in `tests/api/restful/clients/`)
- No raw `page.locator(...)` inside Actions — extend the Page Object instead.
- Keep methods **task-level** (intent-based), not single-click helpers.

### Step Definitions — BDD glue, calls Actions only

```typescript
import { createBdd } from "playwright-bdd";
import { test } from "../support/test.js";

const { Given, When, Then } = createBdd(test);

Then("Verify something happens", async ({ featureActions }) => {
  await featureActions.doSomething();
});

Then("Verify heading equals {string}", async ({ featureActions, state }) => {
  const heading = await featureActions.readHeading();
  state.setSharedData("lastHeading", heading);
});
```

**Rules for Steps:** No locators. No page imports. No `expect(...)` (assertions live in Actions via `element.expect.*`). Use the `state` fixture for cross-step data.

### Feature Files — Gherkin scenarios

```gherkin
@feature @smoke
Feature: Feature Name

  @FEAT-01
  Scenario: Verify something
    Given Admin logs in with valid credentials
    Then Verify something happens
```

## Element API Cheat-Sheet

Everything routes through `ActionExecutor` automatically, so every line below
appears as a step in the Playwright trace and Allure report.

### Common (every element, inherited from `BaseElement`)

| Need | Method |
|---|---|
| Click / double-click / hover | `el.click()` / `el.dblclick()` / `el.hover()` |
| Wait for state | `el.waitForVisible()` / `el.waitForHidden()` |
| Scroll into view | `el.scrollIntoView()` |
| Read text | `await el.text()` (trimmed by default; `{ trim: false }` for raw) |
| Read attribute | `await el.attribute("data-id")` |
| Count matches | `await el.count()` |
| Read visibility / enabled | `await el.isVisible()` / `await el.isEnabled()` |
| Escape hatch | `await el.run("Label", loc => loc.dragTo(target.locator))` |

### Typed methods (only on matching role)

| Role | Methods |
|---|---|
| `Button` | inherits everything above |
| `TextInput` | `fill(v)`, `clear()`, `clearAndFill(v)`, `value()`, `press("Enter")` |
| `Checkbox` | `check()`, `uncheck()`, `isChecked()`, `toggle()` |
| `Dropdown` | `selectOption(value)` |
| `FileInput` | `setFiles(path)` |

### Assertions — element-scoped, web-first auto-waiting

```ts
await el.expect.toBeVisible();
await el.expect.toBeHidden();
await el.expect.toBeEnabled();
await el.expect.toBeDisabled();
await el.expect.toBeChecked();
await el.expect.toBeEditable();
await el.expect.toHaveText("Books");
await el.expect.toContainText("Books");
await el.expect.toHaveValue("hello");
await el.expect.toHaveAttribute("aria-pressed", "true");
await el.expect.toHaveCount(3);

// Negative chain:
await el.expect.not.toBeVisible();
await el.expect.not.toBeChecked();
```

Prefer `el.expect.*` over reading + `expect(...)` in code — it auto-retries until the page settles.

## Page-/Context-Level Helpers (still procedural via `ActionDeps`)

These act on the page or browser context, not a specific element, so they stay
as services injected via `ActionDeps`:

| Need | Where |
|---|---|
| Navigation | `deps.nav.goto(url)`, `deps.nav.reload()`, `deps.nav.waitForURL(re)` |
| Page-level assertions | `deps.pageAssert.urlContains(s)`, `deps.pageAssert.titleIs(s)` |
| Dialogs / Frames / Storage | `deps.dialogs.*`, `deps.frames.*`, `deps.storage.*` (when fixtures are added) |
| API requests | `deps.request` via typed clients in `tests/api/restful/clients/` |
| Composite waits | `core/ui/wait/wait-helper.ts` (`waitForCondition`, `waitForElementStable`, `waitForNetworkIdle`) |
| Shared state | `state.setSharedData(key, value)` / `state.getSharedData<T>(key)` |
| Env config | `config/env.ts` → `ENV.BASE_URL`, `ENV.API_URL` |
| Test assets | `core/utils/file-path.util.ts` → `resolveTestAssetPath()`, `pickRandomTestImage()` |

## Forbidden Patterns (`npm run lint:rules` will reject)

- `this.ui.click(element)`, `this.assert.visible(element)`, `this.read.count(element)` — the procedural action layer was removed.
- `page.locator(...)` / `page.getByRole(...)` inside Action classes — go through a Page Object getter.
- `page.locator(...)` / `getByRole(...)` inside Step files — go through an Action.
- `page.waitForTimeout(n)` — use `el.waitForVisible()` or `el.expect.toBeVisible()`.
- `if` / `switch` / `for` / `while` inside Page Objects.
- `console.log(...)` inside `tests/**` — use the Logger fixture.
- `.click({ force: true })` — fix the underlying actionability issue.
- Hardcoded URLs in step files — read from `config/env.ts`.

## Validation — run after every change

```bash
npm run bddgen          # regenerate specs from features
npx tsc --noEmit        # type-check
npm run lint:rules      # architecture validation
```

All three must pass before considering the work done.
