/** Shared shape of the Make/Model catalog search endpoints — cursor-paginated plain string lists. */
export type CatalogSearchResponse = {
  statusCode: number;
  message: string;
  result: {
    limit: number;
    data: string[];
    hasMore: boolean;
    nextCursor: string | null;
  };
};

export type CategorySuggestion = {
  id: string;
  name: string;
};

export type CategorySuggestionResponse = {
  statusCode: number;
  message: string;
  result: {
    isSuggestion: boolean;
    isAiSuggestion: boolean;
    category: CategorySuggestion;
  };
};

export type Country = {
  _id: string;
  name: string;
  iso2: string;
  iso3: string;
  currency: string;
  currencyName: string;
  currencySymbol: string;
  isActive: boolean;
};

export type State = {
  _id: string;
  country: string;
  name: string;
  code: string;
  isActive: boolean;
};

/** Shared shape of the Country/State location endpoints — offset-paginated, not cursor-paginated like Make/Model. */
export type LocationListResponse<T> = {
  statusCode: number;
  message: string;
  result: {
    total: number;
    page: number;
    limit: number;
    data: T[];
  };
};

export type CountryListResponse = LocationListResponse<Country>;
export type StateListResponse = LocationListResponse<State>;
