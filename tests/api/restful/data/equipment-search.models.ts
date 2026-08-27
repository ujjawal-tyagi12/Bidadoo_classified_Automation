/** Response shapes confirmed live against the QA app's `/api/proxy/...` endpoints —
 * see docs/requirements/equipment-listing-automation-requirements.md §2. */

export type EquipmentFiltersResult = {
  _id: string;
  priceMax: number;
  priceMin: number;
  yearMax: number;
  yearMin: number;
  hourMilesMax: number;
  hourMilesMin: number;
  updatedAt: string;
  equipmentCount: number;
};

export type EquipmentFiltersResponse = {
  statusCode: number;
  message: string;
  result: EquipmentFiltersResult;
};

export type EquipmentModelOption = {
  model: string;
  count: number;
};

export type EquipmentModelListResponse = {
  statusCode: number;
  message: string;
  result: {
    data: EquipmentModelOption[];
    total: number;
    page: number;
    limit: number;
  };
};

export type LocationState = {
  _id: string;
  country: string;
  name: string;
  code: string;
  isActive: boolean;
};

export type LocationStatesResponse = {
  statusCode: number;
  message: string;
  result: {
    total: number;
    page: number;
    limit: number;
    data: LocationState[];
  };
};

export type EquipmentSearchQuery = {
  searchText?: string;
  categoryId?: string;
  model?: string;
  stateId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
};

export type EquipmentSearchResultItem = {
  _id: string;
  categoryName: string;
  information: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
  };
};

export type EquipmentSearchResponse = {
  statusCode: number;
  message: string;
  result: {
    total: number;
    page: number;
    limit: number;
    data: EquipmentSearchResultItem[];
  };
};

/**
 * A node in the category taxonomy tree returned by the "count" endpoint.
 * Confirmed live 3 levels deep; a leaf node has no `children` (or an empty
 * array).
 */
export type CategoryTreeNode = {
  _id: string;
  name: string;
  equipmentCount: number;
  parentId?: string;
  children?: CategoryTreeNode[];
};

export type CategoryTreeResponse = {
  statusCode: number;
  message: string;
  result: {
    data: CategoryTreeNode[];
    total: number;
    page: number;
    limit: number;
  };
};

/** A resolved leaf in the category tree: full top-to-leaf path, its id, and equipment count. */
export type CategoryLeaf = {
  path: string[];
  id: string;
  equipmentCount: number;
};
