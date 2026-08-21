import { AsyncLocalStorage } from "node:async_hooks";
import type { TestLogger } from "./test-logger.js";

const storage = new AsyncLocalStorage<TestLogger>();

/**
 * Module-level fallback when AsyncLocalStorage does not propagate (e.g. some
 * playwright-bdd step boundaries). Set/cleared by the logger fixture per test.
 */
let boundLogger: TestLogger | undefined;

export function bindLogger(logger: TestLogger | undefined): void {
  boundLogger = logger;
}

export function runWithLogger<T>(logger: TestLogger, fn: () => Promise<T>): Promise<T> {
  return storage.run(logger, fn);
}

export function getLogger(): TestLogger | undefined {
  return storage.getStore() ?? boundLogger;
}

