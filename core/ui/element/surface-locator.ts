import type { Locator, Page } from "@playwright/test";
import type { UiSurface } from "../surface/ui-surface.js";
import { BaseElement } from "./base-element.js";
import {
  Button,
  Checkbox,
  Dropdown,
  FileInput,
  GenericElement,
  TextInput,
} from "./elements.js";

export type SurfaceLocatorFn = (page: Page) => Locator;

type ElementCtor<T extends BaseElement> = new (
  name: string,
  locator: Locator,
) => T;

function resolveLocatorForSurface(
  surface: UiSurface,
  strategies: { desktop: SurfaceLocatorFn; msite?: SurfaceLocatorFn },
  page: Page,
): Locator {
  const pick =
    surface === "msite" && strategies.msite != null
      ? strategies.msite
      : strategies.desktop;
  return pick(page);
}

/**
 * Fluent builder for surface-aware, typed elements.
 *
 *   surfaceLocator("Sign In button")
 *     .asButton()
 *     .desktop(p => p.getByRole("button", { name: /sign in/i }))
 *     .build(this.page, this.surface)
 *
 * The element type is picked once on the builder (`.asButton()`,
 * `.asTextInput()`, ...) and propagates to `.build()`'s return type, so the
 * Page getter is typed correctly with no extra annotation.
 */
export class SurfaceLocatorBuilder<T extends BaseElement = GenericElement> {
  private _name = "";
  private _desktop?: SurfaceLocatorFn;
  private _msite?: SurfaceLocatorFn;
  private _ctor: ElementCtor<BaseElement> = GenericElement;

  private constructor() {}

  static withName(name: string): SurfaceLocatorBuilder<GenericElement> {
    const b = new SurfaceLocatorBuilder<GenericElement>();
    b._name = name;
    return b;
  }

  private retype<U extends BaseElement>(
    ctor: ElementCtor<U>,
  ): SurfaceLocatorBuilder<U> {
    this._ctor = ctor;
    return this as unknown as SurfaceLocatorBuilder<U>;
  }

  asButton(): SurfaceLocatorBuilder<Button> {
    return this.retype(Button);
  }

  asTextInput(): SurfaceLocatorBuilder<TextInput> {
    return this.retype(TextInput);
  }

  asCheckbox(): SurfaceLocatorBuilder<Checkbox> {
    return this.retype(Checkbox);
  }

  asDropdown(): SurfaceLocatorBuilder<Dropdown> {
    return this.retype(Dropdown);
  }

  asFileInput(): SurfaceLocatorBuilder<FileInput> {
    return this.retype(FileInput);
  }

  asGeneric(): SurfaceLocatorBuilder<GenericElement> {
    return this.retype(GenericElement);
  }

  desktop(fn: SurfaceLocatorFn): this {
    this._desktop = fn;
    return this;
  }

  msite(fn: SurfaceLocatorFn): this {
    this._msite = fn;
    return this;
  }

  build(page: Page, surface: UiSurface): T {
    if (!this._name || !this._desktop) {
      throw new Error(
        "SurfaceLocatorBuilder: set a name via surfaceLocator(name) and at least .desktop(...)",
      );
    }
    const locator = resolveLocatorForSurface(
      surface,
      { desktop: this._desktop, msite: this._msite },
      page,
    );
    return new this._ctor(this._name, locator) as T;
  }
}

export function surfaceLocator(
  name: string,
): SurfaceLocatorBuilder<GenericElement> {
  return SurfaceLocatorBuilder.withName(name);
}
