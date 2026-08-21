import type { TestInfo } from "@playwright/test";
import { test as base } from "playwright-bdd";
import {
  createTestLogger,
  type TestLogger,
} from "../logger/test-logger.js";
import { bindLogger, runWithLogger } from "../logger/log-context.js";
import {
  ActionExecutor,
  bindExecutor,
  runWithExecutor,
} from "../ui/executor/index.js";

export type LoggerFixture = {
  logger: TestLogger;
};

export const loggerTest = base.extend<LoggerFixture>({
  logger: async ({}, use, testInfo: TestInfo) => {
    const logger = createTestLogger(testInfo);
    const executor = new ActionExecutor(logger);
    bindLogger(logger);
    bindExecutor(executor);
    try {
      await runWithLogger(logger, async () => {
        await runWithExecutor(executor, async () => {
          try {
            await use(logger);
          } finally {
            await logger.flush();
          }
        });
      });
    } finally {
      bindLogger(undefined);
      bindExecutor(undefined);
    }
  },
});

