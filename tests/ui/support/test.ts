import type { TestInfo } from "@playwright/test";
import { baseTest } from "../../../core/fixtures/base.fixture.js";
import { withIsolation } from "../../../core/test-isolation/with-isolation.js";
import type { SessionManager } from "../../../core/sessions/session-manager.js";
import { actionListeners } from "@core/ui";
import { actionFixture, type ActionFixtures } from "./action.fixture.js";
import { sessionFixture } from "./session.fixture.js";
import { surfaceFixture, type SurfaceFixture } from "./surface.fixture.js";
import { uiFixture } from "./ui.fixture.js";
import { highlightListener } from "./highlight.listener.js";
import type {
  UIDialogs,
  UIFrames,
  UIPageAssertions,
  UINavigation,
  UIStorage,
} from "@core/ui";

if (process.env.PW_HIGHLIGHT === "1") {
  actionListeners.register(highlightListener);
}

export const test = baseTest
  .extend<{
    sessions: SessionManager;
    pwTestInfo: TestInfo;
  }>({
    ...sessionFixture,
    pwTestInfo: async ({}, use, testInfo) => {
      await use(testInfo);
    },
  })
  .extend<SurfaceFixture>({
    ...surfaceFixture,
  })
  .extend<
    ActionFixtures & {
      pageAssert: UIPageAssertions;
      nav: UINavigation;
      dialogs: UIDialogs;
      frames: UIFrames;
      storage: UIStorage;
    }
  >({
    ...actionFixture,
    ...uiFixture,
  })
  .extend(withIsolation());
