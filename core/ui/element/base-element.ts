import type { Locator } from "@playwright/test";
import {
  ActionExecutor,
  getExecutor,
} from "../executor/index.js";
import { ElementExpect } from "./element-expect.js";

type WaitForOptions = Omit<
  NonNullable<Parameters<Locator["waitFor"]>[0]>,
  "state"
>;
type ClickOptions = Parameters<Locator["click"]>[0];
type DblClickOptions = Parameters<Locator["dblclick"]>[0];
type HoverOptions = Parameters<Locator["hover"]>[0];
type ScrollOptions = Parameters<Locator["scrollIntoViewIfNeeded"]>[0];
type TextContentOptions = Parameters<Locator["textContent"]>[0];
type GetAttributeOptions = Parameters<Locator["getAttribute"]>[1];
type IsVisibleOptions = Parameters<Locator["isVisible"]>[0];
type IsEnabledOptions = Parameters<Locator["isEnabled"]>[0];
/**
 * BaseElement is the common parent for every typed element.
 *
 * Behaviour shared by every UI element lives here (click/hover/wait/reads).
 * Typed subclasses (TextInput, Checkbox, Dropdown, FileInput) extend this
 * to expose only the methods that make sense for their kind.
 *
 * Executor resolution is lazy and context-driven:
 * - If an executor was passed in, use it.
 * - Otherwise pick the test-scoped one via `getExecutor()`.
 * This means Page constructors do not need to thread an executor through
 * to elements.
 */
export abstract class BaseElement {
  constructor(
    public readonly name: string,
    public readonly locator: Locator,
    private readonly injectedExec?: ActionExecutor,
  ) {}

  protected get exec(): ActionExecutor {
    return this.injectedExec ?? getExecutor();
  }

  get expect(): ElementExpect {
    return new ElementExpect(this);
  }

  /**
   * Escape hatch for any Playwright locator method not surfaced on the
   * element type. Routes through ActionExecutor so step/log/listeners fire.
   *
   * Example:
   *   await el.run("Drag to target", loc => loc.dragTo(target.locator));
   */
  async run<T>(
    label: string,
    fn: (locator: Locator) => Promise<T>,
  ): Promise<T> {
    return await this.exec.perform(label, this, () => fn(this.locator));
  }

  async click(options?: ClickOptions): Promise<void> {
    await this.exec.perform("Click", this, async () => {
      await this.locator.click(options);
    });
  }

  async dblclick(options?: DblClickOptions): Promise<void> {
    await this.exec.perform("Double click", this, async () => {
      await this.locator.dblclick(options);
    });
  }

  async hover(options?: HoverOptions): Promise<void> {
    await this.exec.perform("Hover", this, async () => {
      await this.locator.hover(options);
    });
  }

  async scrollIntoView(options?: ScrollOptions): Promise<void> {
    await this.exec.perform("Scroll into view", this, async () => {
      await this.locator.scrollIntoViewIfNeeded(options);
    });
  }

  async waitForVisible(options?: WaitForOptions): Promise<void> {
    await this.exec.perform("Wait visible", this, async () => {
      await this.locator.waitFor({ state: "visible", ...options });
    });
  }

  async waitForHidden(options?: WaitForOptions): Promise<void> {
    await this.exec.perform("Wait hidden", this, async () => {
      await this.locator.waitFor({ state: "hidden", ...options });
    });
  }

  async count(): Promise<number> {
    return await this.exec.perform("Read count", this, async () => {
      return await this.locator.count();
    });
  }

  async text(options?: TextContentOptions & { trim?: boolean }): Promise<string> {
    return await this.exec.perform("Read text", this, async () => {
      const { trim, ...textOptions } = options ?? {};
      const t = await this.locator.textContent(textOptions);
      const value = t ?? "";
      return trim === false ? value : value.trim();
    });
  }

  async attribute(
    name: string,
    options?: GetAttributeOptions,
  ): Promise<string | null> {
    return await this.exec.perform(`Read attribute ${name}`, this, async () => {
      return await this.locator.getAttribute(name, options);
    });
  }

  async isVisible(options?: IsVisibleOptions): Promise<boolean> {
    return await this.exec.perform("Read isVisible", this, async () => {
      return await this.locator.isVisible(options);
    });
  }

  async isEnabled(options?: IsEnabledOptions): Promise<boolean> {
    return await this.exec.perform("Read isEnabled", this, async () => {
      return await this.locator.isEnabled(options);
    });
  }

  async innerText(options?: TextContentOptions & { trim?: boolean }): Promise<string> {
    return await this.exec.perform("Read innerText", this, async () => {
    return await this.locator.innerText(options);
    });
  }

  async nth(index: number) {
    return await this.locator.nth(index);
}
}
