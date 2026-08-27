import { faker } from "@faker-js/faker";
import type { ApiDeps } from "@core/api";
import type { ScenarioState } from "@core/fixtures";
import { ENV } from "@config/env.js";
import { AuthApiClient } from "../../tests/api/restful/clients/auth.client.js";
import { CatalogApiClient } from "../../tests/api/restful/clients/catalog.client.js";
import type { CreateEquipmentProps } from "../props/create-equipment.props.js";
import { loadCreateEquipmentProps } from "../readers/index.js";

const SHARED_DATA_KEY = "createEquipmentProps";

/**
 * Confirmed-live Make/Model search-term pairs to seed the catalog lookup —
 * the Make/Model APIs are prefix search, not "list everything", so at least
 * one real seed term is required per pair. Only add a pair here after
 * confirming it live via `CatalogApiClient.searchMakes`/`searchModels`;
 * an unverified guess here would silently reintroduce the exact problem
 * this factory exists to avoid (a value nothing in the app actually matches).
 */
const MAKE_MODEL_SEEDS: ReadonlyArray<{ makeSeed: string; modelSeed: string }> = [
  { makeSeed: "Cat", modelSeed: "320" },
];

/**
 * Builds a `CreateEquipmentProps` fixture from the app's own live catalogs
 * (Make, Model, Country, State) via its real backend API, with Faker filling
 * every genuinely free-text/numeric field. Category intentionally stays the
 * curated, hand-verified tree path from `create-equipment.json`: the
 * `/category/suggestion` endpoint returns a flat `{id, name}` with no
 * ancestor path, which the UI's tree-picker (parent toggles → leaf) needs to
 * drive it — that mismatch needs its own follow-up (either resolving the
 * suggestion to a path, or confirming the Category modal exposes a
 * one-click "accept suggestion" affordance) before Category can be sourced
 * the same way. Media Upload's video-link values also stay static — no
 * config API for the allowed-domain whitelist turned up in any network
 * capture, so it's most likely a frontend-only rule.
 */
export async function buildCreateEquipmentProps(deps: ApiDeps): Promise<CreateEquipmentProps> {
  const auth = new AuthApiClient(deps);
  const authToken = await auth.login(ENV.ADMIN_EMAIL, ENV.ADMIN_PASSWORD);
  const catalog = new CatalogApiClient(deps, authToken);

  const seed = faker.helpers.arrayElement(MAKE_MODEL_SEEDS);
  const makes = await catalog.searchMakes(seed.makeSeed);
  const make = faker.helpers.arrayElement(makes);
  const models = await catalog.searchModels(seed.modelSeed);
  const model = faker.helpers.arrayElement(models);

  const countries = await catalog.getCountries();
  const country = faker.helpers.arrayElement(countries);
  const states = await catalog.getStates(country.iso2);
  const state = faker.helpers.arrayElement(states);

  const uniqueSuffix = faker.string.alphanumeric(6).toUpperCase();
  const { categoryPath, mediaUpload } = loadCreateEquipmentProps();

  return {
    validAssetInformation: {
      title: `${make} ${model} - ${uniqueSuffix}`,
      make,
      model,
      categoryPath,
      year: faker.number.int({ min: 1990, max: 2024 }).toString(),
      serial: faker.string.alphanumeric(10).toUpperCase(),
      usageHours: faker.number.int({ min: 100, max: 20000 }).toString(),
      usageType: faker.helpers.arrayElement(["Hours", "Miles", "Kilometers"] as const),
    },
    validLocation: {
      country: country.name,
      state: state.name,
    },
    validPricingContact: {
      price: faker.number.int({ min: 1000, max: 200000 }).toString(),
      // Safe narrowing: the live catalog only has 2 countries today (Canada/CAD, United States/USD).
      currency: country.currency as "USD" | "CAD",
      contactName: faker.person.fullName(),
      contactPhone: faker.string.numeric(10),
      contactEmail: faker.internet.email(),
    },
    validDescriptionDetails: {
      description: faker.lorem.paragraph(),
      features: faker.lorem.sentence(),
      specifications: faker.lorem.sentence(),
    },
    mediaUpload,
  };
}

/**
 * Generates one `CreateEquipmentProps` per scenario and caches it on `state`
 * so every step within the same scenario — fill Asset Information, fill
 * Location, search Listings for the title afterward, etc. — sees the exact
 * same values instead of a fresh random set each call. Mirrors the existing
 * Reference ID sharing pattern (`state.setSharedData("referenceId", ...)`)
 * already used in `create-equipment.steps.ts`.
 */
export async function getOrCreateEquipmentProps(
  state: ScenarioState,
  deps: ApiDeps,
): Promise<CreateEquipmentProps> {
  const cached = state.getSharedData<CreateEquipmentProps>(SHARED_DATA_KEY);
  if (cached) return cached;

  const props = await buildCreateEquipmentProps(deps);
  state.setSharedData(SHARED_DATA_KEY, props);
  return props;
}
