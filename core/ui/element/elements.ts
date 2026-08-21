import type { Locator } from "@playwright/test";
import { BaseElement } from "./base-element.js";

type FillOptions = Parameters<Locator["fill"]>[1];
type ClearOptions = Parameters<Locator["clear"]>[0];
type PressOptions = Parameters<Locator["press"]>[1];
type InputValueOptions = Parameters<Locator["inputValue"]>[0];
type CheckOptions = Parameters<Locator["check"]>[0];
type UncheckOptions = Parameters<Locator["uncheck"]>[0];
type IsCheckedOptions = Parameters<Locator["isChecked"]>[0];
type SelectOptionValue = Parameters<Locator["selectOption"]>[0];
type SelectOptionOptions = Parameters<Locator["selectOption"]>[1];
type SetInputFilesValue = Parameters<Locator["setInputFiles"]>[0];
type SetInputFilesOptions = Parameters<Locator["setInputFiles"]>[1];

/**
 * Generic element for things that have no specialised behaviour beyond what
 * BaseElement already offers (toasts, labels, headings, table cells, etc.).
 * Use the typed variants below when the role of the element is known.
 */
export class GenericElement extends BaseElement {}

/**
 * Button — clickable controls. Inherits `click` / `dblclick` from BaseElement.
 * Use this for `<button>`, role=button, links acting as buttons, toggles,
 * menu items, autocomplete options, etc.
 */
export class Button extends BaseElement {
  fill(arg0: string) {
    throw new Error('Method not implemented.');
  }
}

/**
 * TextInput — text-entry controls (input, textarea, contenteditable).
 * Adds fill / clear / clearAndFill / value() / press().
 */
export class TextInput extends BaseElement {
  async fill(value: string, options?: FillOptions): Promise<void> {
    await this.exec.perform("Fill", this, async () => {
      await this.locator.fill(value, options);
    });
  }

  async clear(options?: ClearOptions): Promise<void> {
    await this.exec.perform("Clear", this, async () => {
      await this.locator.clear(options);
    });
  }

  async clearAndFill(value: string, options?: FillOptions): Promise<void> {
    await this.exec.perform("Clear and fill", this, async () => {
      await this.locator.clear();
      await this.locator.fill(value, options);
    });
  }

  async value(options?: InputValueOptions): Promise<string> {
    return await this.exec.perform("Read value", this, async () => {
      return await this.locator.inputValue(options);
    });
  }

  async press(key: string, options?: PressOptions): Promise<void> {
    await this.exec.perform(`Press(${key})`, this, async () => {
      await this.locator.press(key, options);
    });
  }
  
}

/**
 * Checkbox — adds check / uncheck / isChecked / toggle.
 */
export class Checkbox extends BaseElement {
  async check(options?: CheckOptions): Promise<void> {
    await this.exec.perform("Check", this, async () => {
      await this.locator.check(options);
    });
  }

  async uncheck(options?: UncheckOptions): Promise<void> {
    await this.exec.perform("Uncheck", this, async () => {
      await this.locator.uncheck(options);
    });
  }

  async isChecked(options?: IsCheckedOptions): Promise<boolean> {
    return await this.exec.perform("Read isChecked", this, async () => {
      return await this.locator.isChecked(options);
    });
  }

  async toggle(): Promise<void> {
    await this.exec.perform("Toggle", this, async () => {
      const checked = await this.locator.isChecked();
      if (checked) await this.locator.uncheck();
      else await this.locator.check();
    });
  }
}

/**
 * Dropdown — native `<select>`. Adds selectOption().
 * (Custom JS autocomplete widgets should use TextInput.)
 */
export class Dropdown extends BaseElement {
  async selectOption(
    value: SelectOptionValue,
    options?: SelectOptionOptions,
  ): Promise<void> {
    await this.exec.perform("Select option", this, async () => {
      await this.locator.selectOption(value, options);
    });
  }
}

/**
 * FileInput — file upload controls. Adds setFiles().
 */
export class FileInput extends BaseElement {
  async setFiles(
    files: SetInputFilesValue,
    options?: SetInputFilesOptions,
  ): Promise<void> {
    await this.exec.perform("Set input files", this, async () => {
      await this.locator.setInputFiles(files, options);
    });
  }
}
