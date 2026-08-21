import type { Browser, BrowserContextOptions, TestInfo } from "@playwright/test";
import type { TestLogger } from "@core/logger/test-logger.js";
import { contextOptionsFromUseConfig } from "@core/sessions/context-options.js";
import { SessionManager } from "@core/sessions/session-manager.js";

export const sessionFixture = {
  sessions: async (
    {
      browser,
      logger,
    }: {
      browser: Browser;
      logger: TestLogger;
    },
    use: (m: SessionManager) => Promise<void>,
    testInfo: TestInfo,
  ) => {
    const manager = new SessionManager({
      logger,
      defaultContextOptions: contextOptionsFromUseConfig(
        testInfo.project.use as Partial<BrowserContextOptions>,
      ),
    });
    await use(manager);
    await manager.disposeAll();
  },
};
