import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { TestLogger } from "@core/logger/test-logger.js";
import { ActionExecutor } from "../executor/action-executor.js";

export class UIPageAssertions {
  private readonly exec: ActionExecutor;

  constructor(
    private readonly page: Page,
    logger?: TestLogger,
  ) {
    this.exec = new ActionExecutor(logger);
  }

  async urlIs(url: string | RegExp, options?: { timeout?: number }) {
    await this.exec.step(`Expect URL: ${String(url)}`, async () => {
      await expect(this.page).toHaveURL(url, options);
    });
  }

  async urlContains(partial: string, options?: { timeout?: number }) {
    await this.exec.step(`Expect URL contains: ${partial}`, async () => {
      await expect(this.page).toHaveURL(
        new RegExp(partial.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        options,
      );
    });
  }

  async urlUsesHttps() {
    await this.exec.step("Expect URL uses HTTPS", async () => {
      await expect(this.page).toHaveURL(/^https:/);
    });
  }

  async urlSearchAndHashDoesNotMatch(pattern: RegExp) {
    await this.exec.step(`Expect URL search/hash does not match ${pattern}`, async () => {
      const u = new URL(this.page.url());
      const tail = `${u.search}${u.hash}`.toLowerCase();
      expect(tail).not.toMatch(pattern);
    });
  }

  async titleIs(title: string | RegExp) {
    await this.exec.step(`Expect title: ${String(title)}`, async () => {
      await expect(this.page).toHaveTitle(title);
    });
  }
}

