# CLAUDE.md

Guidance for AI agents (Claude Code, Codex, Copilot Workspace) working in this repository.

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

## Architecture

Five layers, strictly ordered — each layer only calls the one below it:

```text
Features   (tests/ui/features/**/*.feature)   ← Gherkin scenarios
  → Steps  (tests/ui/step-definitions/*.steps.ts) ← BDD glue, calls Actions
    → Actions (tests/ui/actions/*Actions.ts)   ← task-level business logic
      → Pages   (tests/ui/pages/*Page.ts)      ← typed Element getters only
        → Core  (core/**)                      ← Element classes, executor, API, fixtures
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

## Coding Rules

### Features (Gherkin)
- One `.feature` file per module (e.g., `category.feature`)
- Tag each scenario: `@smoke`, `@SUP-01`, `@category`
- Steps should read like business requirements, not implementation details

### Step Definitions
- File naming: `{module}.steps.ts` (kebab-case)
- Only call Action methods — no locators, no page imports
- Use `state.setSharedData()` / `state.getSharedData()` for cross-step data

### Actions
- File naming: `{Feature}Actions.ts` (PascalCase)
- Accept `ActionDeps` via constructor (`pageAssert`, `nav`, `uiSurface`, `request`, `logger`)
- Drive elements via their own methods (`page.x.click()`, `page.x.fill()`, `page.x.expect.toBeVisible()`)
- Task-level methods (intent-based), not single-click helpers
- API calls go through typed API clients, not raw fetch
- Register in `tests/ui/support/action.fixture.ts`

### Pages
- File naming: `{Feature}Page.ts` (PascalCase)
- Expose typed element getters via `surfaceLocator(name).asButton()|asTextInput()|asCheckbox()|asDropdown()|asFileInput()`
- No assertions, no business logic, no `if`/`switch`/`for`/`while`
- Page objects do not need to know about the executor — it is resolved lazily via async context

### General
- **Element behaviour is on the element itself**:
  - `await page.btn.click()`, `await page.input.clearAndFill(value)`, `await page.cb.check()`
  - `await page.input.expect.toBeVisible()`, `await page.toast.expect.toHaveText("Saved")`
  - `await page.list.count()`, `await page.row.text()`
- **Page-/context-level helpers stay procedural**:
  - `nav.goto(url)`, `nav.reload()`, `nav.waitForURL(...)`
  - `pageAssert.urlContains(...)`, `pageAssert.titleIs(...)`
  - `dialogs.acceptNext(...)`, `frames.frame(...)`, `storage.setCookies(...)`
- Use the typed builders on `surfaceLocator` so the element exposes only the methods that make sense for its role (no `searchBox.check()` typos at compile time)
- Use `element.run(label, loc => loc.someExoticMethod(...))` as the escape hatch for Playwright APIs not wrapped on the element type
- No `console.log` — use the Logger fixture
- No `page.waitForTimeout()` — use `WaitHelper` or state-based waits / `element.waitForVisible()`
- URLs from `config/env.ts` — never hardcode

## File Placement & Naming

| Type | Location | Naming |
|------|----------|--------|
| Feature file | `tests/ui/features/web/` | `{module}.feature` |
| Step definition | `tests/ui/step-definitions/` | `{module}.steps.ts` |
| Action class | `tests/ui/actions/` | `{Feature}Actions.ts` |
| Page object | `tests/ui/pages/` | `{Feature}Page.ts` |
| API client | `tests/api/restful/clients/` | `{module}.client.ts` |
| API models | `tests/api/restful/data/` | `{module}.models.ts` |
| Props types | `data/props/` | `{module}.props.ts` |
| Test data JSON | `data/testdata/` | `{module}.json` |
| Test assets | `data/testdata/assets/` | descriptive filename |

## Environment Variables

Configure via `.env` (see `config/env.ts`):

```ini
BASE_URL=http://localhost:3000
API_URL=http://localhost:3000/api
ADMIN_EMAIL=user@example.com
ADMIN_PASSWORD=changeme
```

## CI/CD

- GitHub Actions: `.github/workflows/playwright.yml` (rule check + 4 shards + report merge)
- Smoke gate: `.github/workflows/smoke-tests.yml` (runs on PR)
- Docker: `docker-compose up` runs 4 parallel shards
- Rule engine: `npm run lint:rules` validates architecture before tests
