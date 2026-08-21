# AGENTS.md

Instructions for AI coding agents (GitHub Copilot, Codex, any agent that reads this file).

## Quick Reference

| Task | Command |
|------|---------|
| Type-check | `npx tsc --noEmit` |
| Generate BDD specs | `npm run bddgen` |
| Run all tests | `npm test` |
| Run smoke tests | `npm run test:smoke` |
| Check architecture | `npm run lint:rules` |

## Architecture: 5-Layer BDD

```
Feature (.feature) → Steps (.steps.ts) → Actions (*Actions.ts) → Pages (*Page.ts) → Core (core/**)
```

**Never skip layers.** Steps must not import Pages. Actions must not use raw `page.locator()`.

Elements expose their own behaviour (`page.btn.click()`, `page.input.fill(v)`, `page.toast.expect.toBeVisible()`). Page objects only build typed elements via `surfaceLocator(name).asButton()|asTextInput()|asCheckbox()|asDropdown()|asFileInput()`.

## When Adding a New Test Module

1. Create `tests/ui/pages/{Feature}Page.ts` — typed element getters only
2. Create `tests/ui/actions/{Feature}Actions.ts` — task-level methods that call `element.method()` directly
3. Register the action in `tests/ui/support/action.fixture.ts`
4. Create `tests/ui/step-definitions/{module}.steps.ts` — BDD glue
5. Create `tests/ui/features/web/{module}.feature` — Gherkin scenarios
6. If API data is needed: add client in `tests/api/restful/clients/`, models in `data/`
7. Run `npm run bddgen && npx tsc --noEmit && npm run lint:rules`

## Element model (must follow)

- **Build with the typed builder:**
  ```ts
  get signInButton() {
    return surfaceLocator("Sign In button")
      .asButton()
      .desktop(p => p.getByRole("button", { name: /sign in/i }))
      .build(this.page, this.surface);
  }
  ```
- **Use the element's own methods in Actions** — never reach into the framework for a procedural action layer:
  - `await page.btn.click()`, `await page.input.clearAndFill(value)`, `await page.cb.check()`, `await page.file.setFiles(path)`
  - `await page.x.waitForVisible()`, `await page.x.hover()`, `await page.x.scrollIntoView()`
  - `await page.x.expect.toBeVisible()`, `await page.x.expect.toHaveText(...)`, `await page.x.expect.not.toBeChecked()`
  - `await page.list.count()`, `await page.row.text()`, `await page.x.attribute("data-id")`
- **Escape hatch for exotic Playwright APIs:** `await page.x.run("Label", loc => loc.someMethod(...))` — still logs, still emits listeners.
- **Page-/context-level helpers stay procedural:** `nav.*`, `pageAssert.*`, `dialogs.*`, `frames.*`, `storage.*`.

## Constraints

- No `console.log` — use Logger fixture
- No `page.waitForTimeout()` — use `WaitHelper` or `element.waitForVisible()`
- No hardcoded URLs — use `config/env.ts`
- No assertions in Page objects
- No locators in Step definitions
- Test data in `data/testdata/*.json` with typed props in `data/props/`
- Register all new actions as fixtures
