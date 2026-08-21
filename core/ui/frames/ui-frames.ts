import type { FrameLocator, Page } from "@playwright/test";
import { ActionExecutor } from "../executor/action-executor.js";
import type { TestLogger } from "@core/logger/test-logger.js";

/**
 * Playwright does not "switchToFrame" like Selenium.
 * You work via FrameLocator, which keeps Playwright's auto-waiting intact.
 */
export class UIFrames {
  private readonly exec: ActionExecutor;

  constructor(private readonly page: Page, logger?: TestLogger) {
    this.exec = new ActionExecutor(logger);
  }

  frame(selector: string): FrameLocator {
    return this.page.frameLocator(selector);
  }

  async waitForFrameAttached(selector: string) {
    await this.exec.step(`Wait frame attached: ${selector}`, async () => {
      // Ensures the <iframe> element is in DOM.
      await this.page.locator(selector).waitFor({ state: "attached" });
    });
  }
}

