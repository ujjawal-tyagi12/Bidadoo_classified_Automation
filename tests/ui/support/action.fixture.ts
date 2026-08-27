import type { Page, APIRequestContext } from "@playwright/test";
import type { TestLogger } from "@core/logger/test-logger";
import type { UIPageAssertions, UINavigation } from "@core/ui";
import type { UiSurface } from "@core/ui/surface/ui-surface.js";
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
import { HomeActions } from "../actions/HomeActions.js";
import { SearchResultsActions } from "../actions/SearchResultsActions.js";
import { FilterPanelActions } from "../actions/FilterPanelActions.js";
import { EquipmentDetailActions } from "../actions/EquipmentDetailActions.js";
import { FavoriteActions } from "../actions/FavoriteActions.js";

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
  homeActions: HomeActions;
  searchResultsActions: SearchResultsActions;
  filterPanelActions: FilterPanelActions;
  equipmentDetailActions: EquipmentDetailActions;
  favoriteActions: FavoriteActions;
};

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

export const actionFixture = {
  loginActions: async (
    { page, logger, request, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: LoginActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, pageAssert, nav, uiSurface });
    await use(new LoginActions(page, deps));
  },
  sellerDashboardActions: async (
    { page, logger, request, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: SellerDashboardActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, pageAssert, nav, uiSurface });
    await use(new SellerDashboardActions(page, deps));
  },
  createEquipmentShellActions: async (
    { page, logger, request, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: CreateEquipmentShellActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, pageAssert, nav, uiSurface });
    await use(new CreateEquipmentShellActions(page, deps));
  },
  assetInformationActions: async (
    { page, logger, request, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: AssetInformationActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, pageAssert, nav, uiSurface });
    await use(new AssetInformationActions(page, deps));
  },
  locationActions: async (
    { page, logger, request, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: LocationActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, pageAssert, nav, uiSurface });
    await use(new LocationActions(page, deps));
  },
  pricingContactActions: async (
    { page, logger, request, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: PricingContactActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, pageAssert, nav, uiSurface });
    await use(new PricingContactActions(page, deps));
  },
  descriptionDetailsActions: async (
    { page, logger, request, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: DescriptionDetailsActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, pageAssert, nav, uiSurface });
    await use(new DescriptionDetailsActions(page, deps));
  },
  mediaUploadActions: async (
    { page, logger, request, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: MediaUploadActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, pageAssert, nav, uiSurface });
    await use(new MediaUploadActions(page, deps));
  },
  submissionActions: async (
    { page, logger, request, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: SubmissionActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, pageAssert, nav, uiSurface });
    await use(new SubmissionActions(page, deps));
  },
  homeActions: async (
    { page, logger, request, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: HomeActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, pageAssert, nav, uiSurface });
    await use(new HomeActions(page, deps));
  },
  searchResultsActions: async (
    { page, logger, request, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: SearchResultsActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, pageAssert, nav, uiSurface });
    await use(new SearchResultsActions(page, deps));
  },
  filterPanelActions: async (
    { page, logger, request, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: FilterPanelActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, pageAssert, nav, uiSurface });
    await use(new FilterPanelActions(page, deps));
  },
  equipmentDetailActions: async (
    { page, logger, request, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: EquipmentDetailActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, pageAssert, nav, uiSurface });
    await use(new EquipmentDetailActions(page, deps));
  },
  favoriteActions: async (
    { page, logger, request, pageAssert, nav, uiSurface }: FixtureDeps,
    use: (a: FavoriteActions) => Promise<void>,
  ) => {
    const deps = buildDeps({ page, logger, request, pageAssert, nav, uiSurface });
    await use(new FavoriteActions(page, deps));
  },
};
