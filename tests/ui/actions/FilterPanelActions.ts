import { expect, type Page, devices } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { assertApiOk } from "@core/api";
import { GenericElement } from "@core/ui";
import { WaitHelper } from "@core/ui/wait/index.js";
import { ENV } from "@config/env.js";
import type { ActionDeps } from "../support/action-deps.js";
import { FilterPanelPage, SECTION_LABELS } from "../pages/FilterPanelPage.js";
import { SearchResultsPage } from "../pages/SearchResultsPage.js";
import {
  EquipmentSearchClient,
  flattenCategoryLeaves,
} from "../../api/restful/clients/equipment-search.client.js";
import type { CategoryLeaf, CategoryTreeNode } from "../../api/restful/data/equipment-search.models.js";

/** Joins a category path the same way the app's own active-filter tag renders it. */
export function categoryChipText(path: string[]): string {
  return path.join(" -> ");
}

/**
 * Desktop filter sidebar: 6 collapsible sections (Category, Model, Location,
 * Price Range, Year, Hours/Miles/Km), category-tree cascade selection,
 * self-clamping range sliders, and Apply/Clear All. Real option values
 * (category leaves, models, locations) are fetched live via
 * `EquipmentSearchClient` and picked with faker rather than hardcoded — see
 * docs/requirements/equipment-listing-automation-requirements.md §2-5.
 */
export class FilterPanelActions {
  private readonly filterPanel: FilterPanelPage;
  private readonly searchResults: SearchResultsPage;
  private readonly equipmentSearchClient: EquipmentSearchClient;
  private readonly wait: WaitHelper;

  constructor(
    private readonly page: Page,
    private readonly deps: ActionDeps,
  ) {
    this.filterPanel = new FilterPanelPage(page, deps.uiSurface);
    this.searchResults = new SearchResultsPage(page, deps.uiSurface);
    this.equipmentSearchClient = new EquipmentSearchClient({
      request: deps.request,
      logger: deps.logger,
    });
    this.wait = new WaitHelper(page);
  }

  // --- Live data lookups (API client + faker; never hardcoded) ---

  /**
   * Confirmed live: the Category accordion renders only a fixed subset of
   * the API's full top-level taxonomy (10 of 16, no scroll/"load more" to
   * reach the rest) — reading the actually-rendered names first and
   * constraining the API tree to only those avoids picking a real-but-
   * unreachable top-level category (the root cause of this module's
   * flaky/timing-out category-selection scenarios).
   */
  private async getReachableTopLevelCategoryNodes(): Promise<CategoryTreeNode[]> {
    await this.ensureSectionExpanded(SECTION_LABELS.category);
    // Confirmed live: the list is empty for ~0.5-1s after expanding while an
    // async fetch populates it — wait for at least one row before reading,
    // or this races the same way the price slider bounds did (see
    // waitForRealPriceBounds).
    await this.wait.waitForCondition(async () => {
      return (await this.filterPanel.categoryTopLevelLabels.count()) > 0;
    });
    const renderedNames = await this.filterPanel.categoryTopLevelLabels.run(
      "Read rendered top-level category names",
      (loc) => loc.allInnerTexts(),
    );
    const trimmedNames = new Set(renderedNames.map((name) => name.trim()));
    const response = await this.equipmentSearchClient.getCategoryTree(1, 20);
    assertApiOk(response, "getCategoryTree");
    return response.data.result.data.filter((node) => trimmedNames.has(node.name));
  }

  async pickRealCategoryLeaf(): Promise<CategoryLeaf> {
    const reachableNodes = await this.getReachableTopLevelCategoryNodes();
    const leaves = flattenCategoryLeaves(reachableNodes).filter((leaf) => leaf.equipmentCount > 0);
    return faker.helpers.arrayElement(leaves);
  }

  async pickRealCategoryLeaves(count: number): Promise<CategoryLeaf[]> {
    const reachableNodes = await this.getReachableTopLevelCategoryNodes();
    const leaves = flattenCategoryLeaves(reachableNodes).filter((leaf) => leaf.equipmentCount > 0);
    return faker.helpers.arrayElements(leaves, count);
  }

  /**
   * Confirmed live: the Model list renders only a fixed subset of the API's
   * full model catalog (9 of 32 with results, same no-scroll pattern as
   * Category above) — reading the rendered rows directly, rather than the
   * broader API list, guarantees the picked value is genuinely clickable.
   */
  async pickRealModel(): Promise<string> {
    await this.ensureSectionExpanded(SECTION_LABELS.model);
    await this.wait.waitForCondition(async () => {
      return (await this.filterPanel.modelOptionLabels.count()) > 0;
    });
    const renderedNames = await this.filterPanel.modelOptionLabels.run(
      "Read rendered model option names",
      (loc) => loc.allInnerTexts(),
    );
    const trimmedNames = renderedNames.map((name) => name.trim()).filter(Boolean);
    return faker.helpers.arrayElement(trimmedNames);
  }

  /**
   * Confirmed live: the sidebar renders only a fixed subset of the API's
   * real state/province list (same no-scroll pattern as
   * `getReachableTopLevelCategoryNodes`/`pickRealModel` above) — picking
   * straight from the API without cross-referencing what's actually
   * rendered can pick a real-but-unreachable name (confirmed live: "Hawaii"
   * timed out clicking a locator that never rendered).
   */
  async pickRealLocation(): Promise<string> {
    await this.ensureSectionExpanded(SECTION_LABELS.location);
    await this.wait.waitForCondition(async () => {
      return (await this.filterPanel.locationOptionLabels.count()) > 0;
    });
    const renderedNames = await this.filterPanel.locationOptionLabels.run(
      "Read rendered location option names",
      (loc) => loc.allInnerTexts(),
    );
    const trimmedNames = new Set(renderedNames.map((name) => name.trim()).filter(Boolean));
    const response = await this.equipmentSearchClient.getLocationStates(1, 50);
    assertApiOk(response, "getLocationStates");
    const reachable = response.data.result.data.filter((state) => trimmedNames.has(state.name));
    return faker.helpers.arrayElement(reachable).name;
  }

  // --- Section expand/collapse ---

  private async isSectionExpanded(label: string): Promise<boolean> {
    const chevronClass = await this.filterPanel
      .sectionToggle(label)
      .run("Read section chevron class", (loc) => loc.locator("img").getAttribute("class"));
    return chevronClass?.includes("rotate-180") ?? false;
  }

  async toggleSection(label: string): Promise<void> {
    await this.filterPanel.sectionToggle(label).click();
  }

  private async ensureSectionExpanded(label: string): Promise<void> {
    if (!(await this.isSectionExpanded(label))) {
      await this.toggleSection(label);
    }
  }

  async assertSectionCollapsed(label: string): Promise<void> {
    expect(await this.isSectionExpanded(label)).toBe(false);
  }

  async assertSectionExpanded(label: string): Promise<void> {
    expect(await this.isSectionExpanded(label)).toBe(true);
  }

  // --- Category tree selection ---

  private async isCategoryNodeExpanded(name: string): Promise<boolean> {
    const classAttr = await this.filterPanel.categoryNodeExpandToggle(name).attribute("class");
    return !(classAttr?.includes("-rotate-90") ?? true);
  }

  private async ensureCategoryNodeExpanded(name: string): Promise<void> {
    if (!(await this.isCategoryNodeExpanded(name))) {
      await this.filterPanel.categoryNodeExpandToggle(name).click();
    }
  }

  /**
   * Expands each parent in `path` (idempotently — safe to call for a leaf
   * that shares ancestors with a previously-selected one) and checks the
   * leaf. `path` runs top-level → leaf, e.g.
   * ["Construction Equipment", "Earthmoving", "Crawler Excavators"].
   */
  async selectCategoryLeaf(path: string[]): Promise<void> {
    if (path.length === 0) {
      throw new Error("selectCategoryLeaf requires a non-empty category path");
    }
    await this.ensureSectionExpanded(SECTION_LABELS.category);
    const parents = path.slice(0, -1);
    for (const parent of parents) {
      await this.ensureCategoryNodeExpanded(parent);
    }
    const leaf = path[path.length - 1]!;
    await this.filterPanel.categoryNodeLabel(leaf).click();
  }

  /** Selects a top-level (or any non-leaf) category node, cascading to every descendant leaf. */
  async selectCategoryNode(name: string): Promise<void> {
    await this.ensureSectionExpanded(SECTION_LABELS.category);
    await this.filterPanel.categoryNodeLabel(name).click();
  }

  async selectCategoryLeaves(paths: string[][]): Promise<void> {
    for (const path of paths) {
      await this.selectCategoryLeaf(path);
    }
  }

  /** Picks a real, rendered top-level category that has descendants and at least one matching listing — used for the cascade/overflow-pill case. */
  async pickRealTopLevelCategoryWithChildren(): Promise<string> {
    const reachableNodes = await this.getReachableTopLevelCategoryNodes();
    const candidates = reachableNodes.filter(
      (node) => (node.children?.length ?? 0) > 0 && node.equipmentCount > 0,
    );
    return faker.helpers.arrayElement(candidates).name;
  }

  // --- Model / Location selection ---

  async selectModel(name: string): Promise<void> {
    await this.ensureSectionExpanded(SECTION_LABELS.model);
    await this.filterPanel.modelOptionLabel(name).click();
  }

  async selectLocation(name: string): Promise<void> {
    await this.ensureSectionExpanded(SECTION_LABELS.location);
    await this.filterPanel.locationOptionLabel(name).click();
  }

  // --- Price / Year / Hours-Miles-Km self-clamping range sliders ---

  /**
   * Confirmed live: right after the Price Range section expands, both
   * thumbs briefly report a placeholder `max="0"` for roughly 0.5-1s before
   * the real, dynamic bounds load asynchronously from the backend — reading
   * values immediately (as a plain click + `inputValue()` would) genuinely
   * races this and reads `0` for both thumbs. This polls the max-thumb's own
   * `max` attribute until it reflects real data.
   */
  private async waitForRealPriceBounds(): Promise<void> {
    await this.wait.waitForCondition(async () => {
      const max = await this.filterPanel.priceMaxThumb.attribute("max");
      return Number(max) > 0;
    });
  }

  /**
   * Confirmed live: these are dual-thumb `<input type="range">` pairs with
   * no free-text input. Pressing End on the min-thumb architecturally
   * cannot reach or cross the max-thumb's value — the app clamps it one
   * step below, confirmed both via keyboard and a forced DOM-value attempt.
   */
  async assertPriceMinCannotReachMax(): Promise<void> {
    await this.ensureSectionExpanded(SECTION_LABELS.price);
    await this.waitForRealPriceBounds();
    await this.filterPanel.priceMinThumb.run("Focus min thumb", (loc) => loc.focus());
    await this.filterPanel.priceMinThumb.run("Press End", (loc) => loc.press("End"));
    const minValue = Number(
      await this.filterPanel.priceMinThumb.run("Read min value", (loc) => loc.inputValue()),
    );
    const maxValue = Number(
      await this.filterPanel.priceMaxThumb.run("Read max value", (loc) => loc.inputValue()),
    );
    expect(minValue).toBeLessThan(maxValue);
  }

  // --- Apply / Clear All ---

  /**
   * Confirmed live: right after clicking Apply, the results header/footer
   * briefly still shows the *previous* (pre-filter) count for a moment
   * before the new filtered data loads — the same class of async-population
   * race already found on the Category tree, Price Range slider, and
   * pagination footer. Waiting only for the header to be "visible" doesn't
   * catch this, since it was already visible before the click; this instead
   * waits for its text to actually change from the pre-click snapshot.
   */
  async applyFilters(): Promise<void> {
    const before = await this.searchResults.resultsHeaderCount.text();
    await this.filterPanel.applyFiltersButton.click();
    await this.wait.waitForCondition(async () => {
      const current = await this.searchResults.resultsHeaderCount.text();
      return current !== before;
    });
  }

  /** Same async-population race as `applyFilters` — waits for the header text to actually change, not just be visible. */
  async clearAllViaSidebar(): Promise<void> {
    const before = await this.searchResults.resultsHeaderCount.text();
    await this.filterPanel.sidebarClearAllButton.click();
    await this.wait.waitForCondition(async () => {
      const current = await this.searchResults.resultsHeaderCount.text();
      return current !== before;
    });
  }

  async assertFiltersSidebarVisible(): Promise<void> {
    await this.filterPanel.filtersHeading.expect.toBeVisible();
  }

  async assertFiltersSidebarHidden(): Promise<void> {
    await this.filterPanel.filtersHeading.expect.toBeHidden();
  }

  // --- Price Range slider dynamic max/min boundaries (TC22/TC37) ---

  /**
   * TC22 — confirmed live the slider's own upper bound is dynamic (driven by
   * the current result set), not a fixed $1,000,000. Moves the max-thumb
   * away from its default (already-at-max) position first via ArrowLeft, so
   * the subsequent `End` press is a genuine boundary jump rather than a
   * no-op, then confirms it lands exactly on the thumb's own `max` attribute.
   */
  async assertPriceMaxCanReachOwnMaximum(): Promise<void> {
    await this.ensureSectionExpanded(SECTION_LABELS.price);
    await this.waitForRealPriceBounds();
    const maxAttr = await this.filterPanel.priceMaxThumb.attribute("max");
    await this.filterPanel.priceMaxThumb.run("Focus max thumb", (loc) => loc.focus());
    await this.filterPanel.priceMaxThumb.run("Press ArrowLeft", (loc) => loc.press("ArrowLeft"));
    await this.filterPanel.priceMaxThumb.run("Press End", (loc) => loc.press("End"));
    const value = await this.filterPanel.priceMaxThumb.run("Read max thumb value", (loc) =>
      loc.inputValue(),
    );
    expect(value, "Max thumb value after End").toBe(maxAttr);
  }

  /**
   * TC37 — same family as TC22: the slider's own lower bound is dynamic
   * (observed $434, not $0). Moves the min-thumb away from its default
   * (already-at-min) position via ArrowRight first, then confirms `Home`
   * lands exactly on the thumb's own `min` attribute.
   */
  async assertPriceMinCanReachOwnMinimum(): Promise<void> {
    await this.ensureSectionExpanded(SECTION_LABELS.price);
    await this.waitForRealPriceBounds();
    const minAttr = await this.filterPanel.priceMinThumb.attribute("min");
    await this.filterPanel.priceMinThumb.run("Focus min thumb", (loc) => loc.focus());
    await this.filterPanel.priceMinThumb.run("Press ArrowRight", (loc) => loc.press("ArrowRight"));
    await this.filterPanel.priceMinThumb.run("Press Home", (loc) => loc.press("Home"));
    const value = await this.filterPanel.priceMinThumb.run("Read min thumb value", (loc) =>
      loc.inputValue(),
    );
    expect(value, "Min thumb value after Home").toBe(minAttr);
  }

  // --- Viewport / responsive (TC16, TC40) ---

  /**
   * Confirmed live: this app's desktop/mobile filter-panel layout reacts to
   * pure CSS breakpoints — resizing the viewport mid-test (no navigation)
   * reflows the layout exactly as a fresh page load at that size would.
   */
  async setViewportSize(width: number, height: number): Promise<void> {
    await this.page.setViewportSize({ width, height });
  }

  async assertMobileFiltersTriggerVisible(): Promise<void> {
    await this.filterPanel.mobileFiltersTriggerButton.expect.toBeVisible();
  }

  async assertMobileFiltersTriggerHidden(): Promise<void> {
    await this.filterPanel.mobileFiltersTriggerButton.expect.toBeHidden();
  }

  // --- No internet connection (TC20) ---

  /**
   * TC20 — confirmed live: `context.setOffline(true)` genuinely breaks this
   * app. Triggering a filter Apply (a client-side request) while offline
   * fails with `net::ERR_INTERNET_DISCONNECTED` and the page goes
   * completely blank — not a graceful offline message. The click itself may
   * throw or hang depending on how the app awaits the failed request, so
   * failures here are swallowed; the real assertion is the resulting blank
   * page in `assertPageWentBlankOffline`.
   */
  async applyFiltersWhileOffline(): Promise<void> {
    await this.page.context().setOffline(true);
    await this.filterPanel.applyFiltersButton.click().catch(() => undefined);
  }

  async assertPageWentBlankOffline(): Promise<void> {
    await this.wait.waitForCondition(async () => {
      const bodyText = await this.page.evaluate(() => document.body.innerText).catch(() => "");
      return bodyText.trim().length === 0;
    });
    await this.page.context().setOffline(false);
  }

  // --- Mobile touch interaction (TC26) ---

  /**
   * TC26 — confirmed live via `devices['iPhone 13']` emulation: a real
   * `.tap()` (not `.click()`) on the mobile Filters trigger opens the
   * full-screen overlay. The configured `bdd` project runs Desktop Chrome
   * (non-touch), so this spins up its own short-lived touch-capable context
   * from the current page's own browser and disposes it before returning —
   * self-contained, no shared fixture/session needed for this one narrow
   * check. Reuses `FilterPanelPage` (not raw locators) against that context's
   * page, per this framework's Page Object rule.
   */
  async assertMobileFilterOverlayOpensViaTap(): Promise<void> {
    const browser = this.page.context().browser();
    if (!browser) {
      throw new Error("No browser available to open a mobile-emulated context for TC26");
    }
    // Firefox rejects the `isMobile` context option outright (Playwright
    // limitation, confirmed live: "options.isMobile is not supported in
    // Firefox") — drop it there and keep the rest of the iPhone 13 profile
    // (including hasTouch) so the real touch tap still exercises the
    // touch-triggered overlay.
    const iPhoneDevice = devices["iPhone 13"];
    const deviceProfile =
      browser.browserType().name() === "firefox"
        ? { ...iPhoneDevice, isMobile: undefined }
        : iPhoneDevice;
    const mobileContext = await browser.newContext({ ...deviceProfile, baseURL: ENV.BASE_URL });
    try {
      const mobilePage = await mobileContext.newPage();
      const mobileFilterPanel = new FilterPanelPage(mobilePage, this.deps.uiSurface);
      await mobilePage.goto("/search");
      await mobileFilterPanel.mobileFiltersTriggerButton.waitForVisible();
      await mobileFilterPanel.mobileFiltersTriggerButton.run("Tap Filters trigger (real touch)", (loc) =>
        loc.tap(),
      );
      await mobileFilterPanel.mobileFilterOverlayCloseButton.waitForVisible();
    } finally {
      await mobileContext.close();
    }
  }

  // --- Header / mobile overlay chrome (FLT-001, FLT-002, FLT-008, FLT-023) ---

  /**
   * FLT-001 — confirmed live: `mobileFilterOverlayCloseButton` has 0 matches
   * anywhere in the page (not merely zero-sized, unlike the mobile trigger
   * button) at desktop widths. `toBeHidden()` passes for both "not attached"
   * and "attached but hidden", which is exactly what's needed here.
   */
  async assertDesktopHeaderHasNoCloseIcon(): Promise<void> {
    await this.filterPanel.mobileFilterOverlayCloseButton.expect.toBeHidden();
  }

  async openMobileFilterOverlay(): Promise<void> {
    await this.filterPanel.mobileFiltersTriggerButton.click();
    await this.filterPanel.mobileFilterOverlayCloseButton.waitForVisible();
  }

  /**
   * FLT-002 — confirmed live: the mobile overlay is wrapped in its own real
   * `<aside>`, so the existing `filtersHeading`/`sidebarClearAllButton`
   * getters (built for the desktop sidebar) resolve correctly inside it
   * unchanged.
   */
  async assertMobileOverlayHeaderComplete(): Promise<void> {
    await this.filterPanel.filtersHeading.expect.toBeVisible();
    await this.filterPanel.sidebarClearAllButton.expect.toBeVisible();
    await this.filterPanel.mobileFilterOverlayCloseButton.expect.toBeVisible();
  }

  async closeMobileFilterOverlayViaCloseIcon(): Promise<void> {
    await this.filterPanel.mobileFilterOverlayCloseButton.click();
  }

  /** FLT-008 — confirmed live: clicking the close icon removes the overlay from the DOM. */
  async assertMobileFilterOverlayClosed(): Promise<void> {
    await this.filterPanel.mobileFilterOverlayCloseButton.expect.toBeHidden();
  }

  async pressEscapeKey(): Promise<void> {
    await this.page.keyboard.press("Escape");
  }

  /** FLT-023 — confirmed live: Escape is a no-op on the mobile overlay, it does not close. */
  async assertMobileFilterOverlayStillOpen(): Promise<void> {
    await this.filterPanel.mobileFilterOverlayCloseButton.expect.toBeVisible();
  }

  // --- Section structure (FLT-003, FLT-004, FLT-005, FLT-006, FLT-007, FLT-018) ---

  /** FLT-003 — confirmed live real order: Category, Model, Location, Price Range, Year, Hours/Miles/Kilometers — no "Brands". */
  async assertRealSectionOrderNoBrands(): Promise<void> {
    const labels = await this.filterPanel.filterSectionToggleLabels.run(
      "Read section toggle labels in DOM order",
      (loc) => loc.allInnerTexts(),
    );
    const trimmed = labels.map((label) => label.trim());
    expect(trimmed, "Real filter section order").toEqual([
      SECTION_LABELS.category,
      SECTION_LABELS.model,
      SECTION_LABELS.location,
      SECTION_LABELS.price,
      SECTION_LABELS.year,
      "Hours / Miles / Kilometers",
    ]);
    expect(trimmed.some((label) => label.toLowerCase().includes("brand")), "No Brands section exists").toBe(false);
  }

  /** FLT-004 — confirmed live: exactly one divider-wrapped container per real section, no more, no less. */
  async assertSectionDividersCount(): Promise<void> {
    await this.filterPanel.filterSectionContainers.expect.toHaveCount(Object.keys(SECTION_LABELS).length);
  }

  /**
   * FLT-005 — confirmed live: the button's own CSS position is `static`, but
   * its parent uses `position: sticky`, which is what keeps it pinned near
   * the bottom of the visible sidebar as the page/sidebar scrolls.
   */
  async assertApplyFiltersButtonSticky(): Promise<void> {
    const parentPosition = await this.filterPanel.applyFiltersButton.run(
      "Read Apply Filters button's parent CSS position",
      (loc) => loc.evaluate((el) => getComputedStyle(el.parentElement as HTMLElement).position),
    );
    expect(parentPosition, "Apply Filters button's parent position").toBe("sticky");
  }

  /**
   * FLT-006, FLT-018 — confirmed live: once a section's rendered rows
   * overflow its `overflow-y:auto` container, `scrollHeight` exceeds
   * `clientHeight`, producing a real internal scrollbar.
   */
  async assertSectionListScrollable(label: string): Promise<void> {
    await this.ensureSectionExpanded(label);
    const scrollable = this.filterPanel.sectionScrollableArea(label);
    await this.wait.waitForCondition(async () => (await scrollable.count()) > 0);
    const { scrollHeight, clientHeight } = await scrollable.run(
      `Read ${label} section scroll/client height`,
      (loc) => loc.evaluate((el) => ({ scrollHeight: el.scrollHeight, clientHeight: el.clientHeight })),
    );
    expect(scrollHeight, `${label} section scrollHeight (clientHeight=${clientHeight})`).toBeGreaterThan(
      clientHeight,
    );
  }

  /** FLT-007 — confirmed live: consecutive Category rows sit at a consistent vertical interval. */
  async assertCategoryCheckboxRowSpacingConsistent(): Promise<void> {
    await this.ensureSectionExpanded(SECTION_LABELS.category);
    await this.wait.waitForCondition(async () => (await this.filterPanel.categoryOptionRows.count()) > 0);
    const rowCount = await this.filterPanel.categoryOptionRows.count();
    const sampleSize = Math.min(4, rowCount);
    const yPositions: number[] = [];
    for (let i = 0; i < sampleSize; i++) {
      const row = await this.filterPanel.categoryOptionRows.nth(i);
      const box = await row.boundingBox();
      if (box) yPositions.push(box.y);
    }
    expect(yPositions.length, "Number of measurable Category rows").toBeGreaterThanOrEqual(2);
    const deltas = yPositions.slice(1).map((y, i) => y - yPositions[i]!);
    const firstDelta = deltas[0]!;
    for (const delta of deltas) {
      expect(delta, "Row-to-row vertical spacing").toBe(firstDelta);
    }
  }

  // --- Clear All / section state (FLT-009, FLT-010, FLT-013, FLT-014) ---

  /** FLT-009 — confirmed live: clicking Clear All with nothing selected does not error and leaves the panel intact. */
  async assertClearAllWithNoFiltersDoesNotError(): Promise<void> {
    await this.filterPanel.sidebarClearAllButton.click();
    await this.filterPanel.filtersHeading.expect.toBeVisible();
  }

  /**
   * FLT-010 — confirmed live: Clear All's own click already triggers the
   * results update (the results header text changes), with no separate
   * Apply Filters click in between.
   */
  async assertClearAllAppliesImmediately(): Promise<void> {
    const leaf = await this.pickRealCategoryLeaf();
    await this.selectCategoryLeaf(leaf.path);
    await this.applyFilters();
    const filteredCount = await this.searchResults.resultsHeaderCount.text();

    await this.filterPanel.sidebarClearAllButton.click();
    await this.wait.waitForCondition(async () => {
      const current = await this.searchResults.resultsHeaderCount.text();
      return current !== filteredCount;
    });
    const clearedCount = await this.searchResults.resultsHeaderCount.text();
    expect(clearedCount, "Results header text after Clear All alone").not.toBe(filteredCount);
  }

  /** FLT-014 — reads back a previously selected category leaf's checkbox state. */
  async assertCategoryLeafChecked(name: string): Promise<void> {
    await this.filterPanel.categoryNodeCheckboxState(name).expect.toBeChecked();
  }

  // --- Listing counts, zero-count, Location default state (FLT-015, FLT-016, FLT-017, FLT-019) ---

  private async assertRowsHaveBareNumberCounts(rows: GenericElement, sectionLabel: string): Promise<void> {
    const texts = await rows.run(`Read ${sectionLabel} row texts`, (loc) => loc.allInnerTexts());
    expect(texts.length, `${sectionLabel} rendered row count`).toBeGreaterThan(0);
    for (const rawText of texts) {
      // WebKit's `innerText` inserts extra leading/trailing whitespace around
      // this row's icon markup that Chromium/Firefox don't (confirmed live) —
      // trim before asserting so the check targets the real rendered content,
      // not an engine-specific whitespace quirk.
      const text = rawText.trim();
      expect(text, `${sectionLabel} row "${text}" must not use parenthesised counts`).not.toMatch(/[()]/);
      expect(text, `${sectionLabel} row "${text}" must end in a bare number`).toMatch(/\d+$/);
    }
  }

  /** FLT-015 — confirmed live: counts render as a bare trailing number, e.g. "Agriculture" "63", not "(63)". */
  async assertCategoryListingCountsAreBareNumbers(): Promise<void> {
    await this.ensureSectionExpanded(SECTION_LABELS.category);
    await this.wait.waitForCondition(async () => (await this.filterPanel.categoryOptionRows.count()) > 0);
    await this.assertRowsHaveBareNumberCounts(this.filterPanel.categoryOptionRows, "Category");
  }

  /** FLT-017 — same bare-number format as Category, confirmed live for Model. */
  async assertModelListingCountsAreBareNumbers(): Promise<void> {
    await this.ensureSectionExpanded(SECTION_LABELS.model);
    await this.wait.waitForCondition(async () => (await this.filterPanel.modelOptionRows.count()) > 0);
    await this.assertRowsHaveBareNumberCounts(this.filterPanel.modelOptionRows, "Model");
  }

  /**
   * FLT-016 — confirmed live: a real zero-count category (e.g. "Air
   * Compressors & Tools" "0") is not disabled and checks normally on click.
   * Finds the first rendered row whose trailing count is "0" by reading the
   * same rendered rows two ways (names vs. full row text) and matching by
   * index — both locators iterate the same rendered `<label>` rows in the
   * same DOM order.
   */
  async assertZeroCountCategorySelectable(): Promise<void> {
    await this.ensureSectionExpanded(SECTION_LABELS.category);
    await this.wait.waitForCondition(async () => (await this.filterPanel.categoryTopLevelLabels.count()) > 0);
    const names = await this.filterPanel.categoryTopLevelLabels.run(
      "Read rendered category names for zero-count lookup",
      (loc) => loc.allInnerTexts(),
    );
    const rowTexts = await this.filterPanel.categoryOptionRows.run(
      "Read category row texts for zero-count lookup",
      (loc) => loc.allInnerTexts(),
    );
    const zeroCountIndex = rowTexts.findIndex((text) => /(?:^|\D)0$/.test(text.trim()));
    expect(zeroCountIndex, "A zero-count category row must exist").toBeGreaterThanOrEqual(0);
    const zeroCountName = names[zeroCountIndex]!.trim();
    await this.filterPanel.categoryNodeLabel(zeroCountName).click();
    await this.filterPanel.categoryNodeCheckboxState(zeroCountName).expect.toBeChecked();
  }

  /** FLT-019 — confirmed live: every rendered Location checkbox starts unchecked. */
  async assertAllLocationCheckboxesUncheckedByDefault(): Promise<void> {
    await this.ensureSectionExpanded(SECTION_LABELS.location);
    await this.wait.waitForCondition(async () => (await this.filterPanel.locationOptionLabels.count()) > 0);
    const names = await this.filterPanel.locationOptionLabels.run(
      "Read rendered location names",
      (loc) => loc.allInnerTexts(),
    );
    for (const name of names) {
      await this.filterPanel.locationOptionCheckboxState(name.trim()).expect.not.toBeChecked();
    }
  }

  // --- Hours/Miles unit label, rapid toggling, keyboard tab order (FLT-020, FLT-021, FLT-022) ---

  /** FLT-020 — confirmed live: a fixed compound label ("Hours / Miles: ..."), not a per-listing-type swap. */
  async assertUnitLabelIsFixedCompoundString(): Promise<void> {
    await this.ensureSectionExpanded(SECTION_LABELS.hoursMilesKm);
    await this.filterPanel.hoursMilesUnitLabel.expect.toBeVisible();
    await this.filterPanel.hoursMilesUnitLabel.expect.toContainText("Hours / Miles");
  }

  /**
   * FLT-021 — 5 rapid clicks (odd count) on the same real leaf must land
   * checked, with no crash. Leaves can sit 2-3 levels deep (see
   * `selectCategoryLeaf`), so every ancestor in `leaf.path` must be expanded
   * first or the leaf's own row is never rendered to click.
   */
  async rapidlyToggleRealCategoryLeaf(): Promise<void> {
    const leaf = await this.pickRealCategoryLeaf();
    const parents = leaf.path.slice(0, -1);
    const name = leaf.path[leaf.path.length - 1]!;
    for (const parent of parents) {
      await this.ensureCategoryNodeExpanded(parent);
    }
    for (let i = 0; i < 5; i++) {
      await this.filterPanel.categoryNodeLabel(name).click();
    }
    await this.filterPanel.categoryNodeCheckboxState(name).expect.toBeChecked();
  }

  /**
   * FLT-022 — confirmed live: focusing the Category section's own toggle
   * button and tabbing forward reaches the Model section's toggle within a
   * bounded number of presses, proving Tab moves forward through the
   * section's own rows rather than skipping past the whole section or
   * escaping it entirely. The bound is 2 stops per rendered row (a plain
   * leaf row contributes one focusable checkbox; a parent row confirmed live
   * to additionally expose its own nested expand-chevron `<button>`, a
   * second focusable stop) plus a small margin — not an exact prediction,
   * since which rendered rows are parents varies run to run.
   */
  async assertKeyboardTabOrderCategoryIntoModel(): Promise<void> {
    await this.ensureSectionExpanded(SECTION_LABELS.category);
    await this.wait.waitForCondition(async () => (await this.filterPanel.categoryOptionRows.count()) > 0);
    const rowCount = await this.filterPanel.categoryOptionRows.count();
    const maxTabs = rowCount * 2 + 2;

    const modelToggle = this.filterPanel.sectionToggle(SECTION_LABELS.model);
    await this.filterPanel.sectionToggle(SECTION_LABELS.category).run("Focus Category toggle", (loc) =>
      loc.focus(),
    );

    let landedOnModelToggle = false;
    let tabsPressed = 0;
    while (tabsPressed < maxTabs && !landedOnModelToggle) {
      await this.page.keyboard.press("Tab");
      tabsPressed += 1;
      landedOnModelToggle = await modelToggle.run("Check focus landed on Model toggle", (loc) =>
        loc.evaluate((el) => el === document.activeElement),
      );
    }
    expect(
      landedOnModelToggle,
      `Focus should reach the Model toggle within ${maxTabs} tabs from the Category toggle (took ${tabsPressed})`,
    ).toBe(true);
  }

  /** FLT-024 — confirmed live: pressing Space on a focused checkbox toggles it, independent of a mouse click. */
  async assertCheckboxKeyboardToggleViaSpace(): Promise<void> {
    await this.ensureSectionExpanded(SECTION_LABELS.category);
    await this.wait.waitForCondition(async () => (await this.filterPanel.categoryTopLevelLabels.count()) > 0);
    const names = await this.filterPanel.categoryTopLevelLabels.run(
      "Read rendered category names for keyboard toggle check",
      (loc) => loc.allInnerTexts(),
    );
    const checkbox = this.filterPanel.categoryNodeCheckboxState(names[0]!.trim());
    await checkbox.run("Focus checkbox", (loc) => loc.focus());
    const before = await checkbox.isChecked();
    await this.page.keyboard.press("Space");
    const after = await checkbox.isChecked();
    expect(after, `Checkbox checked state after Space (was ${before})`).toBe(!before);
  }
}
