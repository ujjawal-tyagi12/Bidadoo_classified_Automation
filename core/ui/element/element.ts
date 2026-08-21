import type { Locator } from "@playwright/test";
import { GenericElement } from "./elements.js";

/**
 * Structural type satisfied by every BaseElement subclass.
 * Kept for backwards compatibility with code that only needs to read
 * `name` and `locator` (action listeners, executor).
 */
export type Element = {
  readonly name: string;
  readonly locator: Locator;
};

/**
 * Backwards-compatible factory. New code should prefer the typed builders on
 * `surfaceLocator` (`.asButton()`, `.asTextInput()`, etc.) so the IDE only
 * surfaces methods that make sense for the underlying control.
 */
export function el(name: string, locator: Locator): GenericElement {
  return new GenericElement(name, locator);
}
