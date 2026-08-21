import type { TestIsolationHandlers } from "./types.js";

/**
 * Returns a Playwright `extend` fragment that runs hooks once per test (`auto: true`).
 * Merge into your test: `baseTest.extend(withIsolation({ beforeScenario: ... }))`.
 */
export function withIsolation(handlers: TestIsolationHandlers = {}) {
  return {
    _testIsolationLifecycle: [
      async ({}, use: (v: void) => Promise<void>) => {
        await handlers.beforeScenario?.();
        await use();
        await handlers.afterScenario?.();
      },
      { auto: true },
    ] as const,
  };
}
