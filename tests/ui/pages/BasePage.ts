import type { Page } from "@playwright/test";
import type { UiSurface } from "@core/ui";

export abstract class BasePage {
  constructor(
    protected readonly page: Page,
    protected readonly surface: UiSurface,
  ) {}
}
