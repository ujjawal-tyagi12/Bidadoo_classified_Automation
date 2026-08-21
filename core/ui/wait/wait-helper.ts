import { expect, type Page, type Locator } from "@playwright/test";
import type { Element } from "../element/element.js";

export interface WaitOptions {
  timeout?: number;
  /**
   * Polling interval(s) in ms. Maps to Playwright `expect.poll`'s `intervals`.
   * If omitted, Playwright picks a sensible backoff schedule.
   */
  interval?: number;
  message?: string;
}

const DEFAULT_TIMEOUT = 30_000;

/**
 * Thin wait helpers built on Playwright's web-first assertions and `expect.poll`.
 *
 * - No manual `setTimeout` / `page.waitForTimeout` polling loops.
 * - Every wait integrates with Playwright's tracing, trace viewer, and global
 *   timeout configuration.
 * - Prefer `expect(locator).toBe*` directly in Actions when you have a single
 *   condition. Use `WaitHelper` only for composite or page-level waits.
 */
export class WaitHelper {
  constructor(private readonly page: Page) {}

  private toLocator(target: Locator | Element): Locator {
    return "locator" in target && "name" in target
      ? (target as Element).locator
      : (target as Locator);
  }

  private pollOptions(options?: WaitOptions) {
    return {
      timeout: options?.timeout ?? DEFAULT_TIMEOUT,
      intervals: options?.interval ? [options.interval] : undefined,
      message: options?.message,
    };
  }

  async waitForCondition(
    condition: () => Promise<boolean>,
    options?: WaitOptions,
  ): Promise<void> {
    await expect
      .poll(condition, this.pollOptions(options))
      .toBeTruthy();
  }

  async waitForTextContains(
    target: Locator | Element,
    text: string,
    options?: WaitOptions,
  ): Promise<void> {
    const loc = this.toLocator(target);
    await expect(loc).toContainText(text, {
      timeout: options?.timeout ?? DEFAULT_TIMEOUT,
    });
  }

  async waitForTextEquals(
    target: Locator | Element,
    text: string,
    options?: WaitOptions,
  ): Promise<void> {
    const loc = this.toLocator(target);
    await expect(loc).toHaveText(text, {
      timeout: options?.timeout ?? DEFAULT_TIMEOUT,
    });
  }

  async waitForElementCount(
    target: Locator | Element,
    count: number,
    options?: WaitOptions,
  ): Promise<void> {
    const loc = this.toLocator(target);
    await expect(loc).toHaveCount(count, {
      timeout: options?.timeout ?? DEFAULT_TIMEOUT,
    });
  }

  async waitForUrlContains(
    urlPart: string,
    options?: WaitOptions,
  ): Promise<void> {
    const escaped = urlPart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await expect(this.page).toHaveURL(new RegExp(escaped), {
      timeout: options?.timeout ?? DEFAULT_TIMEOUT,
    });
  }

  async waitForNetworkIdle(options?: { timeout?: number }): Promise<void> {
    await this.page.waitForLoadState("networkidle", {
      timeout: options?.timeout ?? DEFAULT_TIMEOUT,
    });
  }

  async waitForElementStable(
    target: Locator | Element,
    options?: WaitOptions,
  ): Promise<void> {
    const loc = this.toLocator(target);
    let last: { x: number; y: number; width: number; height: number } | null =
      null;

    await expect
      .poll(async () => {
        const current = await loc.boundingBox();
        const stable =
          last !== null &&
          current !== null &&
          last.x === current.x &&
          last.y === current.y &&
          last.width === current.width &&
          last.height === current.height;
        last = current;
        return stable;
      }, this.pollOptions(options))
      .toBeTruthy();
  }
}
