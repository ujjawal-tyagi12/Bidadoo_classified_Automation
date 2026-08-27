import { apiRequest, assertApiOk, type ApiDeps } from "@core/api";
import { ENDPOINTS } from "../endpoints.js";
import type {
  CatalogSearchResponse,
  CategorySuggestion,
  CategorySuggestionResponse,
  Country,
  CountryListResponse,
  State,
  StateListResponse,
} from "../data/catalog.models.js";

/**
 * Reads the app's own real Make/Model/Category/Location catalogs, live —
 * so generated test data always matches something the UI's autocomplete or
 * picklist will actually accept, instead of a value invented by Faker that
 * happens to look plausible but matches nothing real.
 */
export class CatalogApiClient {
  constructor(
    private readonly deps: ApiDeps,
    private readonly authToken: string,
  ) {}

  private authHeaders() {
    return { Authorization: `Bearer ${this.authToken}` };
  }

  async searchMakes(search: string): Promise<string[]> {
    const result = await apiRequest(this.deps)
      .get(ENDPOINTS.catalog.make)
      .withHeaders(this.authHeaders())
      .withQuery({ search, limit: 10 })
      .execute<CatalogSearchResponse>();
    assertApiOk(result, "CatalogApiClient.searchMakes");
    return result.data.result.data;
  }

  async searchModels(search: string): Promise<string[]> {
    const result = await apiRequest(this.deps)
      .get(ENDPOINTS.catalog.model)
      .withHeaders(this.authHeaders())
      .withQuery({ search, limit: 10 })
      .execute<CatalogSearchResponse>();
    assertApiOk(result, "CatalogApiClient.searchModels");
    return result.data.result.data;
  }

  async getCategorySuggestion(make: string, model: string): Promise<CategorySuggestion> {
    const result = await apiRequest(this.deps)
      .get(ENDPOINTS.catalog.categorySuggestion)
      .withHeaders(this.authHeaders())
      .withQuery({ make, model })
      .execute<CategorySuggestionResponse>();
    assertApiOk(result, "CatalogApiClient.getCategorySuggestion");
    return result.data.result.category;
  }

  /** Confirmed live: unlike Make/Model/Category, the location endpoints are called with no Authorization header at all — sending one gets a 401 instead of being ignored. */
  async getCountries(): Promise<Country[]> {
    const result = await apiRequest(this.deps)
      .get(ENDPOINTS.location.countries)
      .withQuery({ page: 1, limit: 10 })
      .execute<CountryListResponse>();
    assertApiOk(result, "CatalogApiClient.getCountries");
    return result.data.result.data;
  }

  /** `countryIso2` is the 2-letter code from `getCountries()` (e.g. "US"), not the display name. */
  async getStates(countryIso2: string): Promise<State[]> {
    const result = await apiRequest(this.deps)
      .get(ENDPOINTS.location.states)
      .withQuery({ page: 1, limit: 10, country: countryIso2 })
      .execute<StateListResponse>();
    assertApiOk(result, "CatalogApiClient.getStates");
    return result.data.result.data;
  }
}
