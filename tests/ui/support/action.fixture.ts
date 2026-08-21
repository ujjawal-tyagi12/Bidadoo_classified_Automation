import type { Page, APIRequestContext } from "@playwright/test";
import type { TestLogger } from "@core/logger/test-logger";
import type { UIPageAssertions, UINavigation } from "@core/ui";
import type { UiSurface } from "@core/ui/surface/ui-surface.js";
import type { ActionDeps } from "./action-deps.js";

export type { ActionDeps } from "./action-deps.js";

// Register each {Feature}Actions class here as you add it under tests/ui/actions/, e.g.:
//
// import { LoginActions } from "../actions/LoginActions.js";
//
// export type ActionFixtures = {
//   loginActions: LoginActions;
// };
export type ActionFixtures = {};

type FixtureDeps = {
  page: Page;
  logger?: TestLogger;
  request: APIRequestContext;
  pageAssert: UIPageAssertions;
  nav: UINavigation;
  uiSurface: UiSurface;
};

function buildDeps(d: FixtureDeps): ActionDeps {
  return {
    pageAssert: d.pageAssert,
    nav: d.nav,
    uiSurface: d.uiSurface,
    request: d.request,
    logger: d.logger,
  };
}

// Add a fixture entry per action class, e.g.:
//
// export const actionFixture = {
//   loginActions: async (
//     { page, logger, request, pageAssert, nav, uiSurface }: FixtureDeps,
//     use: (a: LoginActions) => Promise<void>,
//   ) => {
//     const deps = buildDeps({ page, logger, request, pageAssert, nav, uiSurface });
//     await use(new LoginActions(page, deps));
//   },
// };
export const actionFixture = {};
