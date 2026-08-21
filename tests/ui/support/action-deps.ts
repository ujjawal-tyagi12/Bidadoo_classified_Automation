import type { APIRequestContext } from "@playwright/test";
import type {UIPageAssertions, UINavigation } from "@core/ui";
import type { UiSurface } from "@core/ui/surface/ui-surface.js";
import type { TestLogger } from "@core/logger/test-logger.js";

export type ActionDeps = {
  pageAssert: UIPageAssertions;
  nav: UINavigation;
  uiSurface: UiSurface;
  request: APIRequestContext;
  logger?: TestLogger;
};
