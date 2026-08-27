import type { Page, APIRequestContext } from "@playwright/test";
import type { TestLogger } from "@core/logger/test-logger";
import type { UIPageAssertions, UINavigation } from "@core/ui";
import type { UiSurface } from "@core/ui/surface/ui-surface.js";
import type { ScenarioState } from "@core/fixtures";
import type { ActionDeps } from "./action-deps.js";
import { LoginActions } from "../actions/LoginActions.js";
import { SellerDashboardActions } from "../actions/SellerDashboardActions.js";
import { CreateEquipmentShellActions } from "../actions/CreateEquipmentShellActions.js";
import { AssetInformationActions } from "../actions/AssetInformationActions.js";
import { LocationActions } from "../actions/LocationActions.js";
import { PricingContactActions } from "../actions/PricingContactActions.js";
import { DescriptionDetailsActions } from "../actions/DescriptionDetailsActions.js";
import { MediaUploadActions } from "../actions/MediaUploadActions.js";
import { SubmissionActions } from "../actions/SubmissionActions.js";
import { ListingsActions } from "../actions/ListingsActions.js";
import { CustomAttributesActions } from "../actions/CustomAttributesActions.js";

export type { ActionDeps } from "./action-deps.js";

export type ActionFixtures = {
  loginActions: LoginActions;
  sellerDashboardActions: SellerDashboardActions;
  createEquipmentShellActions: CreateEquipmentShellActions;
  assetInformationActions: AssetInformationActions;
  locationActions: LocationActions;
  pricingContactActions: PricingContactActions;
  descriptionDetailsActions: DescriptionDetailsActions;
  mediaUploadActions: MediaUploadActions;
  submissionActions: SubmissionActions;
  listingsActions: ListingsActions;
  customAttributesActions: CustomAttributesActions;
};

type FixtureDeps = {
  page: Page;
  logger?: TestLogger;
  request: APIRequestContext;
  state: ScenarioState;
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
    state: d.state,
    logger: d.logger,
  };
}

export const actionFixture = {
  loginActions: async (
    { page, logger, request, state, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: LoginActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, state, pageAssert, nav, uiSurface });
    await use(new LoginActions(page, deps));
  },
  sellerDashboardActions: async (
    { page, logger, request, state, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: SellerDashboardActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, state, pageAssert, nav, uiSurface });
    await use(new SellerDashboardActions(page, deps));
  },
  createEquipmentShellActions: async (
    { page, logger, request, state, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: CreateEquipmentShellActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, state, pageAssert, nav, uiSurface });
    await use(new CreateEquipmentShellActions(page, deps));
  },
  assetInformationActions: async (
    { page, logger, request, state, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: AssetInformationActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, state, pageAssert, nav, uiSurface });
    await use(new AssetInformationActions(page, deps));
  },
  locationActions: async (
    { page, logger, request, state, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: LocationActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, state, pageAssert, nav, uiSurface });
    await use(new LocationActions(page, deps));
  },
  pricingContactActions: async (
    { page, logger, request, state, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: PricingContactActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, state, pageAssert, nav, uiSurface });
    await use(new PricingContactActions(page, deps));
  },
  descriptionDetailsActions: async (
    { page, logger, request, state, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: DescriptionDetailsActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, state, pageAssert, nav, uiSurface });
    await use(new DescriptionDetailsActions(page, deps));
  },
  mediaUploadActions: async (
    { page, logger, request, state, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: MediaUploadActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, state, pageAssert, nav, uiSurface });
    await use(new MediaUploadActions(page, deps));
  },
  submissionActions: async (
    { page, logger, request, state, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: SubmissionActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, state, pageAssert, nav, uiSurface });
    await use(new SubmissionActions(page, deps));
  },
  listingsActions: async (
    { page, logger, request, state, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: ListingsActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, state, pageAssert, nav, uiSurface });
    await use(new ListingsActions(page, deps));
  },
  customAttributesActions: async (
    { page, logger, request, state, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: CustomAttributesActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, state, pageAssert, nav, uiSurface });
    await use(new CustomAttributesActions(page, deps));
  },
};
