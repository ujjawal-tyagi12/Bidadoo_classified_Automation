import type { BrowserContext, Page } from "@playwright/test";
import { ActionExecutor } from "../executor/action-executor.js";
import type { TestLogger } from "@core/logger/test-logger.js";

export type CookieParam = {
  name: string;
  value: string;
  url?: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
};

export class UIStorage {
  private readonly exec: ActionExecutor;

  constructor(
    private readonly page: Page,
    private readonly context: BrowserContext,
    logger?: TestLogger,
  ) {
    this.exec = new ActionExecutor(logger);
  }

  async setCookies(cookies: CookieParam[]) {
    await this.exec.step(`Set cookies: ${cookies.length}`, async () => {
      await this.context.addCookies(cookies);
    });
  }

  async clearCookies() {
    await this.exec.step("Clear cookies", async () => {
      await this.context.clearCookies();
    });
  }

 
  async setLocalStorageNow(key: string, value: string) {
    await this.exec.step(`Set localStorage now: ${key}`, async () => {
      await this.page.evaluate(
        ([k, v]) => localStorage.setItem(k, v),
        [key, value] as const,
      );
    });
  }

  async setLocalStorageInit(key: string, value: string) {
    await this.exec.step(`Set localStorage init: ${key}`, async () => {
      await this.page.addInitScript(
        ([k, v]) => localStorage.setItem(k, v),
        [key, value] as const,
      );
    });
  }

  async getLocalStorage(key: string): Promise<string | null> {
    return await this.exec.step(`Get localStorage: ${key}`, async () => {
      return await this.page.evaluate((k) => localStorage.getItem(k), key);
    });
  }

  async removeLocalStorage(key: string) {
    await this.exec.step(`Remove localStorage: ${key}`, async () => {
      await this.page.evaluate((k) => localStorage.removeItem(k), key);
    });
  }
}

