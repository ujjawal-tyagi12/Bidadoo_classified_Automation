# CLAUDE.md

Guidance for AI agents (Claude Code, Codex, Copilot Workspace, Cursor) working in this repository.

This is a **project-agnostic Playwright automation framework** (UI + API) with an optional
BDD layer (`playwright-bdd`). `core/`, `config/`, `scripts/`, and `rules/` are the reusable
framework — day-to-day scripting happens under `tests/` and `data/`.

## Commands

```bash
npm run bddgen                  # Generate Playwright specs from .feature files
npm test                        # bddgen + run all tests
npm run test:features           # BDD desktop tests only
npm run test:features:msite     # BDD mobile-site tests only
npm run test:features:headed    # BDD desktop tests with browser visible
npm run test:smoke              # Tests tagged @smoke
npm run test:ui                 # All UI tests
npm run test:api                # All API tests
npm run lint:rules              # Run framework rule engine (architecture check)
npm run lint:rules:staged       # Rule engine on git-staged files only
npx tsc --noEmit                # TypeScript type-check without emitting
npm run report                  # Open Playwright HTML report
npm run report:allure           # Generate + open Allure report
```

**Validation — run after every change.** All three must pass before considering work done:

```bash
npm run bddgen          # regenerate specs from features
npx tsc --noEmit        # type-check
npm run lint:rules      # architecture validation
```

## Architecture

Five layers, strictly ordered — each layer only calls the one below it. **Never skip
layers.** Steps must not import Pages. Actions must not use raw `page.locator()`.

```text
Features   (tests/ui/features/**/*.feature)      ← Gherkin scenarios
  → Steps  (tests/ui/step-definitions/*.steps.ts) ← BDD glue, calls Actions
    → Actions (tests/ui/actions/*Actions.ts)      ← task-level business logic
      → Pages   (tests/ui/pages/*Page.ts)         ← typed Element getters only
        → Core  (core/**)                         ← Element classes, executor, API, fixtures
```

Supporting layers:
- `tests/api/restful/` — API clients, models, endpoints
- `core/ui/element/` — `BaseElement`, typed variants (`Button`, `TextInput`, `Checkbox`, `Dropdown`, `FileInput`, `GenericElement`), `ElementExpect`, `surfaceLocator`
- `core/ui/executor/` — `ActionExecutor` (single point for step/log/listener), `getExecutor`/`runWithExecutor` async context
- `core/ui/{navigation,assertions,dialog,frames,storage,wait}` — page/context-level helpers (`nav`, `pageAssert`, `dialogs`, `frames`, `storage`, `WaitHelper`)
- `core/fixtures/` — Logger, ScenarioState, base test composition (sets up executor context for the test scope)
- `core/sessions/` — Multi-user SessionManager
- `data/` — Props types, readers, JSON test data, asset files
- `config/` — env.ts, playwright.config.ts

## Non-negotiable rules

- **No assumptions.** If a detail isn't explicitly present in the codebase, config, or the
  user's instructions, don't assume it. Never invent selectors, routes, env vars, test data
  keys, feature flags, file paths, exports, types, or helpers, or a "standard pattern" that
  isn't already used here. When uncertain, inspect the repo first; if it's still ambiguous,
  ask 1-3 targeted questions before implementing.
- **Frontend-first.** Before writing pages/actions/steps for a screen, verify against the
  real app (source if available, otherwise the rendered DOM/network calls) — don't assume
  one screen's fields, validation strings, or submit conditions match another. Only reuse a
  Page Object/helper across screens when the same component genuinely renders both.
- **Smallest change that fits.** Match existing framework patterns; don't add new
  dependencies, abstractions, or helper layers unless the repo already uses that approach or
  the user asks for it.

## Coding Rules

### Features (Gherkin)
- One `.feature` file per module (e.g., `category.feature`), under `tests/ui/features/web/`
  (desktop, project `bdd`) or `tests/ui/features/msite/` (mobile, project `bdd-msite`,
  scenarios tagged `@msite`)
- Tag each scenario: `@smoke`, `@<TICKET-ID>`, `@<module>`
- Steps should read like business requirements, not implementation details

### Step Definitions
- File naming: `{module}.steps.ts` (kebab-case), in `tests/ui/step-definitions/`
- Only call Action methods — no locators, no page imports, no `expect(...)` (assertions
  live in Actions via `element.expect.*`)
- Use `state.setSharedData()` / `state.getSharedData<T>()` for cross-step data

### Actions
- File naming: `{Feature}Actions.ts` (PascalCase), in `tests/ui/actions/`
- Accept `ActionDeps` via constructor (`pageAssert`, `nav`, `uiSurface`, `request`, `logger`)
- Drive elements via their own methods (`page.x.click()`, `page.x.fill()`, `page.x.expect.toBeVisible()`)
- Task-level methods (intent-based), not single-click helpers unless genuinely reused
- No raw `page.locator(...)` / `page.getByRole(...)` inside Actions — extend the Page Object instead
- API calls go through typed API clients in `tests/api/restful/clients/`, not raw fetch
- Register every new Actions class as a fixture in `tests/ui/support/action.fixture.ts`

### Pages
- File naming: `{Feature}Page.ts` (PascalCase), in `tests/ui/pages/`
- Expose typed element getters via `surfaceLocator(name).asButton()|asTextInput()|asCheckbox()|asDropdown()|asFileInput()`
- No assertions, no business logic, no `if`/`switch`/`for`/`while` (enforced by `lint:rules`)
- Page objects do not need to know about the executor — it is resolved lazily via async context

### Core / framework code
- Prefer explicit types at module boundaries (exports, public methods); rely on inference internally
- Keep functions small and single-purpose; no "do-everything" methods
- No dead code, stray semicolons, or unused imports/vars
- Prefer `const`; don't mutate unless necessary; use early returns over nested conditionals
- No `any` unless there's truly no alternative, and keep its scope as narrow as possible
- Await every wait/assertion before interacting; never rely on arbitrary timing
- Use `satisfies` for object-shape checks where the repo already does; don't duplicate string
  unions — centralize where a shared type already exists

## Element model (must follow)

Build every element via the `surfaceLocator` fluent builder in a Page. Pick the role that
matches the underlying control — it unlocks the role-specific methods. Omit the role for
read-only elements (labels, toasts, headings, table cells) — those default to
`GenericElement` and still expose `click`, `text`, `count`, `attribute`, `expect.*`.

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
      .desktop((p) => p.locator("table tbody tr", { has: p.locator(`text="${name}"`) }))
      .build(this.page, this.surface);
  }
}
```

**Surface-aware locators (single source of truth):** define every control with
`.desktop(p => ...)` even when desktop and m-site match today — `.desktop` is the default on
**all** surfaces until you add `.msite(p => ...)`, so a future m-site DOM change is an
additive edit, not a migration. Use raw `el()` / `page.locator` only for ephemeral
composition inside actions (e.g. `.nth()`, dynamic steps), never as the primary pattern for
stable page elements.

### Element API cheat-sheet

Everything routes through `ActionExecutor` automatically, so every line below appears as a
step in the Playwright trace and Allure report.

**Common (every element, inherited from `BaseElement`):**

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

**Typed methods (only on matching role):**

| Role | Methods |
|---|---|
| `Button` | inherits everything above |
| `TextInput` | `fill(v)`, `clear()`, `clearAndFill(v)`, `value()`, `press("Enter")` |
| `Checkbox` | `check()`, `uncheck()`, `isChecked()`, `toggle()` |
| `Dropdown` | `selectOption(value)` |
| `FileInput` | `setFiles(path)` |

**Assertions — element-scoped, web-first auto-waiting:**

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

Prefer `el.expect.*` over reading + `expect(...)` in code — it auto-retries until the page
settles. Prefer state-based waits (`element.waitForVisible()`, `element.expect.toBeVisible/
Hidden/Enabled/Disabled()`) over sleeps or timeouts.

**Page-/context-level helpers stay procedural** (injected via `ActionDeps`, not on elements):

| Need | Where |
|---|---|
| Navigation | `deps.nav.goto(url)`, `deps.nav.reload()`, `deps.nav.waitForURL(re)` |
| Page-level assertions | `deps.pageAssert.urlContains(s)`, `deps.pageAssert.titleIs(s)` |
| Dialogs / Frames / Storage | `deps.dialogs.*`, `deps.frames.*`, `deps.storage.*` |
| API requests | `deps.request` via typed clients in `tests/api/restful/clients/` |
| Composite waits | `core/ui/wait/wait-helper.ts` (`waitForCondition`, `waitForElementStable`, `waitForNetworkIdle`) |
| Shared state | `state.setSharedData(key, value)` / `state.getSharedData<T>(key)` |
| Env config | `config/env.ts` → `ENV.BASE_URL`, `ENV.API_URL` |
| Test assets | `core/utils/file-path.util.ts` → `resolveTestAssetPath()`, `pickRandomTestImage()` |

## UI test stability

- Avoid brittle selectors (deep CSS chains, text-only selectors) unless the repo already
  uses them for that area — prefer role/label/testid locators.
- Never log or assert secrets/tokens. Assert URL shape via `pageAssert` (e.g. "no token in
  URL") when relevant.
- Make navigation deterministic: assert the expected page state after navigation (header
  visible, key element visible) instead of trusting a bare `goto`.
- If an element may or may not appear (popups, toasts), guard with `await element.isVisible()`
  before interacting rather than assuming it's there.

## Workflow: adding a new test module

1. **Page Object** → `tests/ui/pages/{Feature}Page.ts` — typed element getters only
2. **Action Class** → `tests/ui/actions/{Feature}Actions.ts` — task-level methods that call `element.method()` directly
3. **Register fixture** → add to `tests/ui/support/action.fixture.ts`
4. **Step Definitions** → `tests/ui/step-definitions/{module}.steps.ts`
5. **Feature File** → `tests/ui/features/web/{module}.feature`
6. **Validate** → `npm run bddgen && npx tsc --noEmit && npm run lint:rules`

If the module needs test data from JSON:

7. **Test Data** → `data/testdata/{module}.json`
8. **Props Type** → `data/props/{module}.props.ts`
9. **Reader** → add a loader in `data/readers/ui-data.reader.ts`, re-export from `data/readers/index.ts`

If the module needs API integration:

10. **API Models** → `tests/api/restful/data/{module}.models.ts`
11. **API Client** → `tests/api/restful/clients/{module}.client.ts`
12. **Endpoint** → add to `tests/api/restful/endpoints.ts`

## Forbidden patterns (`npm run lint:rules` rejects these)

- A procedural action layer (`this.ui.click(element)`, `this.assert.visible(element)`,
  `this.read.count(element)`) — drive elements through their own methods instead.
- `page.locator(...)` / `page.getByRole(...)` / `page.getByText(...)` inside Action classes —
  go through a Page Object getter.
- `page.locator(...)` / `getByRole(...)` / `getByText(...)` inside Step files — go through an Action.
- `page.waitForTimeout(n)` anywhere — use `el.waitForVisible()` or `el.expect.toBeVisible()`.
- `if` / `switch` / `for` / `while` inside Page Objects.
- `console.log(...)` inside `tests/**` — use the Logger fixture.
- `.click({ force: true })` — fix the underlying actionability issue instead.
- Hardcoded URLs in step files — read from `config/env.ts`.

## File Placement & Naming

| Type | Location | Naming |
|------|----------|--------|
| Feature file | `tests/ui/features/web/` (or `msite/`) | `{module}.feature` |
| Step definition | `tests/ui/step-definitions/` | `{module}.steps.ts` |
| Action class | `tests/ui/actions/` | `{Feature}Actions.ts` |
| Page object | `tests/ui/pages/` | `{Feature}Page.ts` |
| API client | `tests/api/restful/clients/` | `{module}.client.ts` |
| API models | `tests/api/restful/data/` | `{module}.models.ts` |
| Props types | `data/props/` | `{module}.props.ts` |
| Test data JSON | `data/testdata/` | `{module}.json` |
| Test assets | `data/testdata/assets/` | descriptive filename |

## Environment Variables

Configure via `.env` (copy from `.env.example`; see `config/env.ts`):

```ini
BASE_URL=http://localhost:3000
API_URL=http://localhost:3000/api
# Optional: dedicated m-site host. If unset, m-site BDD uses BASE_URL (responsive-only).
# MSITE_BASE_URL=

ADMIN_EMAIL=
ADMIN_PASSWORD=
```

URLs and credentials always come from `config/env.ts` — never hardcode them in tests.

## CI/CD

- GitHub Actions: `.github/workflows/cloudfaredeploy.yml` (rule check → Playwright run →
  Allure/HTML report deploy). Adjust or replace the deploy target for your own hosting.
- Docker: `docker-compose up` runs 4 parallel shards (`docker-compose.yml`); `Dockerfile`
  builds a self-contained Playwright test image
- Rule engine: `npm run lint:rules` validates architecture before tests — wire it as a
  required CI check
