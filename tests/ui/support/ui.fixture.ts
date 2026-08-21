import type { TestLogger } from "@core/logger/test-logger";
import {
  UIDialogs,
  UIFrames,
  UIPageAssertions,
  UINavigation,
  UIStorage,
} from "@core/ui";

export type UiBag = {
  pageAssert: UIPageAssertions;
  nav: UINavigation;
  dialogs: UIDialogs;
  frames: UIFrames;
  storage: UIStorage;
};

export const uiFixture = {
  pageAssert: async (
    { page, logger }: { page: import("@playwright/test").Page; logger: TestLogger },
    use: (p: UIPageAssertions) => Promise<void>,
  ) => {
    await use(new UIPageAssertions(page, logger));
  },
  nav: async (
    { page, logger }: { page: import("@playwright/test").Page; logger: TestLogger },
    use: (n: UINavigation) => Promise<void>,
  ) => {
    await use(new UINavigation(page, logger));
  },
  dialogs: async (
    { page, logger }: { page: import("@playwright/test").Page; logger: TestLogger },
    use: (d: UIDialogs) => Promise<void>,
  ) => {
    await use(new UIDialogs(page, logger));
  },
  frames: async (
    { page, logger }: { page: import("@playwright/test").Page; logger: TestLogger },
    use: (f: UIFrames) => Promise<void>,
  ) => {
    await use(new UIFrames(page, logger));
  },
  storage: async (
    { page, logger }: { page: import("@playwright/test").Page; logger: TestLogger },
    use: (s: UIStorage) => Promise<void>,
  ) => {
    await use(new UIStorage(page, page.context(), logger));
  },
};
