import type { UiSurface } from "../core/ui/surface/ui-surface.js";

declare module "@playwright/test" {
  interface PlaywrightTestOptions {
    /** Web automation surface; drives `uiSurface` fixture and surface-aware locators. */
    uiSurface?: UiSurface;
  }
}
