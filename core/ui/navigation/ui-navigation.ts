import type { Page } from "@playwright/test";
import type { TestLogger } from "@core/logger/test-logger.js";
import { ActionExecutor } from "../executor/action-executor.js";
import type { Element } from "../element/element.js";

export type LoadState = "load" | "domcontentloaded" | "networkidle";

export class UINavigation {
  private readonly exec: ActionExecutor;

  constructor(private readonly page: Page, logger?: TestLogger) {
    this.exec = new ActionExecutor(logger);
  }

  async goto(urlOrPath: string) {
    await this.exec.step(`Goto: ${urlOrPath}`, async () => {
      await this.page.goto(urlOrPath);
    });
  }
  

  async reload() {
    await this.exec.step("Reload page", async () => {
      await this.page.reload();
    });
  }

  async back() {
    await this.exec.step("Go back", async () => {
      await this.page.goBack();
    });
  }

  async forward() {
    await this.exec.step("Go forward", async () => {
      await this.page.goForward();
    });
  }

  async waitForURL(url: string | RegExp) {
    await this.exec.step(`Wait for URL: ${String(url)}`, async () => {
      await this.page.waitForURL(url);
    });
  }

  async waitForLoadState(state: LoadState = "load") {
    await this.exec.step(`Wait for load state: ${state}`, async () => {
      await this.page.waitForLoadState(state);
    });
  }

  async clickAndWaitForURL(element: Element, url: string | RegExp) {
    await this.exec.step(`Click and wait for URL: ${element.name} → ${String(url)}`, async () => {
      await Promise.all([
        this.page.waitForURL(url),
        this.exec.perform("Click", element, async () => {
          await element.locator.click();
        }),
      ]);
    });
  }
}

