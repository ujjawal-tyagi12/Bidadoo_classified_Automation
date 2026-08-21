import { expect, type Locator } from "@playwright/test";
import { getExecutor, type ActionExecutor } from "../executor/index.js";
import type { BaseElement } from "./base-element.js";

type Expector = ReturnType<typeof expect<Locator>>;

type VisibleOptions = Parameters<Expector["toBeVisible"]>[0];
type HiddenOptions = Parameters<Expector["toBeHidden"]>[0];
type EnabledOptions = Parameters<Expector["toBeEnabled"]>[0];
type DisabledOptions = Parameters<Expector["toBeDisabled"]>[0];
type EditableOptions = Parameters<Expector["toBeEditable"]>[0];
type CheckedOptions = Parameters<Expector["toBeChecked"]>[0];
type TextOptions = Parameters<Expector["toHaveText"]>[1];
type ContainsTextOptions = Parameters<Expector["toContainText"]>[1];
type ValueOptions = Parameters<Expector["toHaveValue"]>[1];
type AttributeOptions = { timeout?: number; ignoreCase?: boolean };
type CountOptions = Parameters<Expector["toHaveCount"]>[1];


export class ElementExpect {
  constructor(
    private readonly element: BaseElement,
    private readonly negated = false,
  ) {}

  private get exec(): ActionExecutor {
    return getExecutor();
  }

  get not(): ElementExpect {
    return new ElementExpect(this.element, !this.negated);
  }

  private matcher() {
    const base = expect(this.element.locator);
    return this.negated ? base.not : base;
  }

  private label(name: string): string {
    return this.negated ? `Expect not ${name}` : `Expect ${name}`;
  }

  async toBeVisible(options?: VisibleOptions): Promise<void> {
    await this.exec.perform(this.label("visible"), this.element, async () => {
      await this.matcher().toBeVisible(options);
    });
  }

  async toBeHidden(options?: HiddenOptions): Promise<void> {
    await this.exec.perform(this.label("hidden"), this.element, async () => {
      await this.matcher().toBeHidden(options);
    });
  }

  async toBeEnabled(options?: EnabledOptions): Promise<void> {
    await this.exec.perform(this.label("enabled"), this.element, async () => {
      await this.matcher().toBeEnabled(options);
    });
  }

  async toBeDisabled(options?: DisabledOptions): Promise<void> {
    await this.exec.perform(this.label("disabled"), this.element, async () => {
      await this.matcher().toBeDisabled(options);
    });
  }

  async toBeEditable(options?: EditableOptions): Promise<void> {
    await this.exec.perform(this.label("editable"), this.element, async () => {
      await this.matcher().toBeEditable(options);
    });
  }

  async toBeChecked(options?: CheckedOptions): Promise<void> {
    await this.exec.perform(this.label("checked"), this.element, async () => {
      await this.matcher().toBeChecked(options);
    });
  }

  async toHaveText(
    text: string | RegExp | (string | RegExp)[],
    options?: TextOptions,
  ): Promise<void> {
    await this.exec.perform(
      this.label(`text=${String(text)}`),
      this.element,
      async () => {
        await this.matcher().toHaveText(text, options);
      },
    );
  }

  async toContainText(
    text: string | RegExp | (string | RegExp)[],
    options?: ContainsTextOptions,
  ): Promise<void> {
    await this.exec.perform(
      this.label(`containsText=${String(text)}`),
      this.element,
      async () => {
        await this.matcher().toContainText(text, options);
      },
    );
  }

  async toHaveValue(
    value: string | RegExp,
    options?: ValueOptions,
  ): Promise<void> {
    await this.exec.perform(
      this.label(`value=${String(value)}`),
      this.element,
      async () => {
        await this.matcher().toHaveValue(value, options);
      },
    );
  }

  async toHaveAttribute(
    name: string,
    value?: string | RegExp,
    options?: AttributeOptions,
  ): Promise<void> {
    await this.exec.perform(
      this.label(`attribute ${name}`),
      this.element,
      async () => {
        await this.matcher().toHaveAttribute(name, value ?? /.*/, options);
      },
    );
  }

  async toHaveCount(count: number, options?: CountOptions): Promise<void> {
    await this.exec.perform(
      this.label(`count=${count}`),
      this.element,
      async () => {
        await this.matcher().toHaveCount(count, options);
      },
    );
  }
}
