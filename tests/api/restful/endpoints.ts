import { ENV } from "@config/env.js";

/**
 * Real endpoint paths behind this app's Next.js API proxy, confirmed live
 * against the QA app (see docs/requirements/equipment-listing-automation-requirements.md
 * §2). The flat, top-level paths below are relative to ENV.BASE_URL — the
 * proxy lives on the same origin as the website itself, not a separate API
 * host (confirmed live: the chromium.newPage() network log for these calls
 * showed the full app origin, not ENV.API_URL's default). The nested groups
 * (`auth`, `catalog`, `location`) were captured the same way but are built
 * against `ENV.API_URL` (see docs/requirements/create-equipment-automation-requirements.md)
 * for clients that run outside that shared-origin page context.
 */
const root = ENV.API_URL;

export const ENDPOINTS = {
  equipmentAnalyticsFilters: "/api/proxy/bd-search/v1/equipment-analytics/filters",
  equipmentModels: "/api/proxy/bd-equipment/v1/equipments/model",
  locationStates: "/api/proxy/bd-equipment/v1/location/states",
  equipmentsSearch: "/api/proxy/bd-search/v1/equipments",
  /**
   * Despite its name, this endpoint returns the full nested category
   * taxonomy tree (with a per-node `equipmentCount`), not a single number —
   * confirmed live, a discrepancy from the requirements doc's description of
   * it as a plain "result count" endpoint. It requires `page`/`limit` query
   * params (1-100) or the backend returns a 400 validation error.
   */
  equipmentsCount: "/api/proxy/bd-equipment/v1/equipments/count",
  /**
   * Confirmed live (see docs/requirements/equipment-favorite-automation-requirements.md
   * §2): this one call goes directly to the external API host
   * (`bidadoo-qa-services.azure-api.net`), NOT through this app's usual
   * `/api/proxy/...` Next.js proxy every other endpoint above uses — a genuine,
   * confirmed exception, not an oversight. `page.route()` mocks must match on
   * the path suffix only (see `SearchResultsPage.FAVORITE_MOCK_FAILURE_MESSAGE`
   * usage in `FavoriteActions`), not the proxy-relative form.
   */
  addToFavoritesToggle: "/bd-equipment/v1/add-to-favorites/toggle",
  auth: {
    login: `${root}/proxy/bd-auth/v1/accounts/login`,
  },
  catalog: {
    make: `${root}/proxy/bd-equipment/v1/category/make`,
    model: `${root}/proxy/bd-equipment/v1/category/model`,
    categorySuggestion: `${root}/proxy/bd-equipment/v1/category/suggestion`,
  },
  location: {
    countries: `${root}/proxy/bd-equipment/v1/location/countries`,
    states: `${root}/proxy/bd-equipment/v1/location/states`,
  },
} as const;
