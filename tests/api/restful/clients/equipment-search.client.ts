import { apiRequest } from "@core/api";
import type { ApiDeps, ApiResult } from "@core/api";
import { ENDPOINTS } from "../endpoints.js";
import type {
  EquipmentFiltersResponse,
  EquipmentModelListResponse,
  LocationStatesResponse,
  EquipmentSearchQuery,
  EquipmentSearchResponse,
  CategoryTreeResponse,
  CategoryTreeNode,
  CategoryLeaf,
} from "../data/equipment-search.models.js";

/**
 * Typed client for the Equipment Listing page's search/filter endpoints.
 * Used from Actions to fetch real, live filter option values (category
 * leaves, model numbers, location states) instead of hardcoding values that
 * may not exist as real options on the page — see
 * docs/requirements/equipment-listing-automation-requirements.md §2.
 */
export class EquipmentSearchClient {
  constructor(private readonly deps: ApiDeps) {}

  async getFilters(): Promise<ApiResult<EquipmentFiltersResponse>> {
    return apiRequest(this.deps)
      .get(ENDPOINTS.equipmentAnalyticsFilters)
      .execute<EquipmentFiltersResponse>();
  }

  async getModelOptions(page = 1, limit = 10): Promise<ApiResult<EquipmentModelListResponse>> {
    return apiRequest(this.deps)
      .get(ENDPOINTS.equipmentModels)
      .withQuery({ page, limit })
      .execute<EquipmentModelListResponse>();
  }

  async getLocationStates(page = 1, limit = 10): Promise<ApiResult<LocationStatesResponse>> {
    return apiRequest(this.deps)
      .get(ENDPOINTS.locationStates)
      .withQuery({ page, limit })
      .execute<LocationStatesResponse>();
  }

  /** Returns the full nested category taxonomy tree (see endpoints.ts for why this uses the "count" path). */
  async getCategoryTree(page = 1, limit = 20): Promise<ApiResult<CategoryTreeResponse>> {
    return apiRequest(this.deps)
      .get(ENDPOINTS.equipmentsCount)
      .withQuery({ page, limit })
      .execute<CategoryTreeResponse>();
  }

  async searchEquipments(query: EquipmentSearchQuery): Promise<ApiResult<EquipmentSearchResponse>> {
    return apiRequest(this.deps)
      .get(ENDPOINTS.equipmentsSearch)
      .withQuery({ ...query })
      .execute<EquipmentSearchResponse>();
  }
}

/**
 * Flattens a category tree to its leaf nodes (nodes with no children),
 * recording each leaf's full top-to-leaf path. Used to pick a real, live
 * category leaf at random via faker rather than hardcoding a path that may
 * no longer exist.
 */
export function flattenCategoryLeaves(
  nodes: CategoryTreeNode[],
  parentPath: string[] = [],
): CategoryLeaf[] {
  return nodes.flatMap((node) => {
    const path = [...parentPath, node.name];
    if (!node.children || node.children.length === 0) {
      return [{ path, id: node._id, equipmentCount: node.equipmentCount }];
    }
    return flattenCategoryLeaves(node.children, path);
  });
}
