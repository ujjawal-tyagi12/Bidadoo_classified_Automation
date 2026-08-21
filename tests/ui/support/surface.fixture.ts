import type { TestInfo } from "@playwright/test";
import {
  uiSurfaceFromPlaywrightProject,
  type UiSurface,
} from "@core/ui/surface/ui-surface.js";

export type SurfaceFixture = {
  uiSurface: UiSurface;
};

export const surfaceFixture = {
  uiSurface: async (
    {},
    use: (surface: UiSurface) => Promise<void>,
    testInfo: TestInfo,
  ) => {
    const fromConfig = testInfo.project.use.uiSurface;
    await use(fromConfig ?? uiSurfaceFromPlaywrightProject(testInfo.project.name));
  },
};
