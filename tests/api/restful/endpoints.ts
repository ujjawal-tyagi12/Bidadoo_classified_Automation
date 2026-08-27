import { ENV } from "@config/env.js";

/**
 * Every path here was captured live from the real app's own network calls
 * (see docs/requirements/create-equipment-automation-requirements.md), not
 * assumed from a spec — the app proxies its backend calls through its own
 * `/api/proxy/...` route, so paths are built against `ENV.API_URL` (which
 * already includes that `/api` prefix), not a separate backend host.
 */
const root = ENV.API_URL;

export const ENDPOINTS = {
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
