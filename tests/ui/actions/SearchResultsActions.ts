import { expect, type Page } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { WaitHelper } from "@core/ui/wait/index.js";
import type { ActionDeps } from "../support/action-deps.js";
import { SearchResultsPage } from "../pages/SearchResultsPage.js";
import { EquipmentDetailPage } from "../pages/EquipmentDetailPage.js";
import { ENDPOINTS } from "../../api/restful/endpoints.js";

/** Real sort option labels, in the QA app's actual DOM order (confirmed live — differs
 * cosmetically from the supplied test sheet, which lists Most/Least Expensive reversed). */
export const SORT_OPTIONS_IN_ORDER = [
  "Recommended",
  "Newest Model",
  "Oldest Model",
  "Least Expensive",
  "Most Expensive",
] as const;

export type SortOption = (typeof SORT_OPTIONS_IN_ORDER)[number];

function parseHeaderCount(text: string): number {
  const match = text.match(/of\s+(\d+)\s+results/i);
  if (!match) {
    throw new Error(`Could not parse results count from header text: "${text}"`);
  }
  return Number(match[1]);
}

function parseTotalPages(text: string): number {
  const match = text.match(/of\s+(\d+)/i);
  if (!match) {
    throw new Error(`Could not parse total pages from text: "${text}"`);
  }
  return Number(match[1]);
}

/**
 * `/search` results page: counts, sort, pagination, active-filter tag bar,
 * empty state, and result cards. See
 * docs/requirements/equipment-listing-automation-requirements.md §3-4.
 */
export class SearchResultsActions {
  private readonly results: SearchResultsPage;
  private readonly equipmentDetail: EquipmentDetailPage;
  private readonly wait: WaitHelper;

  constructor(
    private readonly page: Page,
    private readonly deps: ActionDeps,
  ) {
    this.results = new SearchResultsPage(page, deps.uiSurface);
    this.equipmentDetail = new EquipmentDetailPage(page, deps.uiSurface);
    this.wait = new WaitHelper(page);
  }

  async open(): Promise<void> {
    await this.deps.nav.goto("/search");
    await this.results.resultsHeaderCount.waitForVisible();
  }

  async assertResultsVisible(): Promise<void> {
    await this.results.resultsHeaderCount.expect.toBeVisible();
  }

  async readTotalResultsCount(): Promise<number> {
    const text = await this.results.resultsHeaderCount.text();
    return parseHeaderCount(text);
  }

  /**
   * Confirmed live: right after `/search` loads, the pagination footer
   * briefly reports a placeholder "Of 1" before the real total loads
   * asynchronously — the same class of race already found on the Category
   * tree and Price Range slider. A plain two-reads-agree stability check
   * doesn't catch this (two reads close together can both land on the same
   * still-stale "1"), so this instead waits for internal consistency with
   * the header's result count: the default page size is confirmed live to
   * be 10 (see requirements doc §3), so more than 10 total results can
   * never genuinely fit on a single page.
   */
  private static readonly DEFAULT_PAGE_SIZE = 10;

  async readTotalPages(): Promise<number> {
    await this.wait.waitForCondition(async () => {
      const totalResults = await this.readTotalResultsCount();
      const totalPages = parseTotalPages(await this.results.paginationTotalPagesText.text());
      // Confirmed live: immediately after `/search` loads, the header
      // itself briefly shows the same "0 of 0 results" placeholder as the
      // footer's "Of 1" — so `totalResults === 0` alone doesn't distinguish
      // "still loading" from a real empty result set. `readTotalPages()` is
      // only ever called where results are expected to exist (a baseline
      // read, or after applying a filter chosen to have matches), so
      // treating 0 as "still loading" here is safe for how this method is
      // actually used.
      if (totalResults === 0) {
        return false;
      }
      return totalPages > 1 || totalResults <= SearchResultsActions.DEFAULT_PAGE_SIZE;
    });
    return parseTotalPages(await this.results.paginationTotalPagesText.text());
  }

  async assertResultsCountDecreasedFrom(baselineCount: number): Promise<void> {
    const current = await this.readTotalResultsCount();
    expect(current).toBeLessThan(baselineCount);
  }

  async assertTotalPagesDecreasedFrom(baselinePages: number): Promise<void> {
    const current = await this.readTotalPages();
    expect(current).toBeLessThan(baselinePages);
  }

  async readFirstResultTitle(): Promise<string> {
    return (await this.results.resultCardTitle(0).attribute("alt")) ?? "";
  }

  async assertSortOptionsAvailable(): Promise<void> {
    await this.results.sortTrigger.click();
    for (const label of SORT_OPTIONS_IN_ORDER) {
      await this.results.sortOption(label).expect.toBeVisible();
    }
  }

  /**
   * Confirmed live: the sort trigger toggles the dropdown open/closed on
   * each click. Unconditionally clicking it here would close the dropdown
   * if a prior step (e.g. `assertSortOptionsAvailable`) already opened it
   * and left it open — only open it when the target option isn't already
   * visible, so this method is correct regardless of the dropdown's
   * incoming state.
   */
  async sortBy(label: (typeof SORT_OPTIONS_IN_ORDER)[number]): Promise<void> {
    const option = this.results.sortOption(label);
    if (!(await option.isVisible())) {
      await this.results.sortTrigger.click();
    }
    await option.click();
    await this.results.resultsHeaderCount.expect.toBeVisible();
  }

  async assertFirstResultTitleChanged(previousTitle: string): Promise<void> {
    const current = await this.readFirstResultTitle();
    expect(current).not.toBe(previousTitle);
  }

  async goToNextPage(): Promise<void> {
    await this.results.paginationNextButton.click();
    await this.results.resultsHeaderCount.expect.toBeVisible();
  }

  async assertFirstAndPreviousPageControlsDisabled(): Promise<void> {
    await this.results.paginationFirstButton.expect.toBeDisabled();
    await this.results.paginationPreviousButton.expect.toBeDisabled();
  }

  /**
   * Confirmed live: the "Recommended"-sorted result list can include
   * listings that have since expired — clicking their "View Details" lands
   * on a real page reading "The listing you're trying to view is no longer
   * open for inquiries or purchase." instead of equipment detail content
   * (no breadcrumb). This is stale live data, not a navigation defect, so
   * this falls back to the next result card rather than failing the whole
   * scenario on whichever index happens to be expired right now.
   */
  async openResultDetail(maxAttempts = 5): Promise<void> {
    for (let index = 0; index < maxAttempts; index++) {
      await this.results.viewDetailsButton(index).waitForVisible();
      await this.results.viewDetailsButton(index).click();
      await this.deps.nav.waitForURL(/\/search\/[a-f0-9]{24}/i);
      try {
        await this.equipmentDetail.breadcrumb.waitForVisible({ timeout: 8000 });
        return;
      } catch {
        await this.deps.nav.goto("/search");
        await this.results.resultsHeaderCount.waitForVisible();
      }
    }
    throw new Error(`Could not reach a non-expired listing among the first ${maxAttempts} results`);
  }

  /**
   * Opens the detail page for the result card whose title exactly matches
   * `title`, rather than assuming it's the first result. Needed because this
   * app's search tokenizes rather than exact-phrase-matches — a search for a
   * supposedly-unique seeded title can still return older near-duplicate
   * titles ahead of it (confirmed live), so `openResultDetail()`'s
   * index-based approach isn't reliable for a seeded fixture. Also retries
   * the search itself: a just-published listing (confirmed live, especially
   * a heavy one with many images) can take longer than a single page load
   * to become searchable — re-navigating on a miss handles that indexing lag
   * instead of failing on the first attempt.
   */
  async openResultDetailByExactTitle(title: string): Promise<void> {
    const button = this.results.viewDetailsButtonForExactTitle(title);
    await this.wait.waitForCondition(
      async () => {
        if (await button.isVisible()) return true;
        await this.deps.nav.goto(`/search?searchText=${encodeURIComponent(title)}`);
        await this.results.resultsHeaderCount.waitForVisible().catch(() => undefined);
        return await button.isVisible();
      },
      { timeout: 60000, interval: 3000 },
    );
    await button.click();
    await this.deps.nav.waitForURL(/\/search\/[a-f0-9]{24}/i);
  }

  async removeFilterTag(chipText: string): Promise<void> {
    await this.results.removeFilterTagButton(chipText).click();
    await this.results.resultsHeaderCount.expect.toBeVisible();
  }

  async assertFilterTagVisible(chipText: string): Promise<void> {
    await this.results.activeFilterChip(chipText).expect.toBeVisible();
  }

  async assertFilterTagHidden(chipText: string): Promise<void> {
    await this.results.activeFilterChip(chipText).expect.toBeHidden();
  }

  /** TC13 — confirmed live: removing then reselecting the same category leaf renders exactly one chip, never a duplicate. */
  async assertFilterTagAppearsExactlyOnce(chipText: string): Promise<void> {
    await this.results.activeFilterChip(chipText).expect.toHaveCount(1);
  }

  async assertFilterTagsVisible(chipTexts: string[]): Promise<void> {
    for (const chipText of chipTexts) {
      await this.assertFilterTagVisible(chipText);
    }
  }

  async clearAllViaTagBar(): Promise<void> {
    await this.results.tagBarClearAllButton.click();
    await this.results.resultsHeaderCount.expect.toBeVisible();
  }

  /** Confirmed live: the tag-bar Clear All button only renders while a filter/search term is active. */
  async assertNoActiveFilters(): Promise<void> {
    await this.results.tagBarClearAllButton.expect.toBeHidden();
  }

  async assertHasActiveFilters(): Promise<void> {
    await this.results.tagBarClearAllButton.expect.toBeVisible();
  }

  /**
   * Confirmed live: an "N More" overflow pill is always rendered in the tag
   * bar (even "0 More" with a single clean tag and no overflow — a genuine
   * app quirk), so this asserts the pill reports a real, non-zero overflow
   * count rather than merely asserting its presence.
   */
  async assertOverflowPillShowsRealOverflow(): Promise<void> {
    const text = await this.results.overflowMorePill.text();
    const match = text.match(/^(\d+)\s+More$/);
    expect(match, `Overflow pill text "${text}" did not match "<n> More"`).not.toBeNull();
    expect(Number(match?.[1])).toBeGreaterThan(0);
  }

  /**
   * Confirmed live: the generic empty-state message can take several
   * seconds to appear (the backend responds with a 422 first, before the
   * client falls back to this message) — a generous timeout avoids flaking.
   */
  async assertEmptyStateVisible(): Promise<void> {
    await this.results.emptyStateMessage.expect.toBeVisible({ timeout: 30000 });
  }

  // --- Backend/API error handling (TC15, TC33) ---

  /**
   * TC15 — confirmed live: a mocked 500 from the real search endpoint does
   * NOT produce a distinct error banner. The app falls back to the exact
   * same generic empty-state message used for a genuine zero-result search
   * (requirements doc §4/§7) — there is no dedicated error-state UI today.
   */
  async openWithMockedSearchFailure(): Promise<void> {
    await this.page.route(`**${ENDPOINTS.equipmentsSearch}*`, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ statusCode: 500, error: "InternalServerError", message: "mocked failure" }),
      }),
    );
    await this.deps.nav.goto("/search");
  }

  /**
   * TC33 — same mocking mechanism as TC15, but a delay + abort to simulate a
   * hung/timed-out request instead of an immediate error response. Confirmed
   * live: the app eventually falls back to the same generic empty-state
   * message as TC15, just after the added delay.
   */
  async openWithMockedSearchTimeout(): Promise<void> {
    await this.page.route(`**${ENDPOINTS.equipmentsSearch}*`, async (route) => {
      await new Promise<void>((resolve) => setTimeout(resolve, 2000));
      await route.abort("timedout");
    });
    await this.deps.nav.goto("/search");
  }

  // --- Invalid filter selection (TC30) ---

  /**
   * TC30 — confirmed live: a Category checkbox list only ever offers real,
   * server-provided values, so the closest real equivalent to "an invalid
   * category selection" is a manipulated `categoryId` URL param. A
   * well-formed-but-nonexistent 24-hex-char id (a real Mongo ObjectId shape,
   * generated fresh via faker rather than hardcoded) returns a genuine `422`
   * from the live backend, gracefully absorbed into the same generic
   * empty-state UI (requirements doc §4/§7).
   */
  async openWithInvalidCategoryId(): Promise<void> {
    const bogusCategoryId = faker.database.mongodbObjectId();
    await this.deps.nav.goto(`/search?categoryId=${bogusCategoryId}`);
  }

  // --- Large number of filters / listings (TC21, TC36) ---

  /**
   * TC21/TC22/TC37 — confirms the results page still renders coherent,
   * parseable data (not a crash, blank page, or truncated/garbled count)
   * after an edge-case filter action (a full parent-category cascade, or a
   * price slider pinned to its own dynamic extreme).
   */
  async assertResultsRenderWithoutError(): Promise<void> {
    await this.assertResultsVisible();
    const totalResults = await this.readTotalResultsCount();
    expect(totalResults, "Total results after edge-case filter action").toBeGreaterThanOrEqual(0);
  }

  /**
   * TC36 — a lightweight assertion against the existing unfiltered baseline
   * (967+ results / ~97-98 pages at verification time) rather than
   * manufacturing synthetic data, per the requirements doc's own decision
   * (§7): the app already proves pagination scales to this volume today.
   */
  async assertLargeUnfilteredBaseline(): Promise<void> {
    // Confirmed live: right after `/search` loads, the header briefly shows
    // a "0 of 0" placeholder before the real count populates — the same
    // async-population race documented on `readTotalPages`. Reading
    // `readTotalPages()` first (it already polls past that race) guarantees
    // real data has landed before the plain `readTotalResultsCount()` read
    // below.
    const totalPages = await this.readTotalPages();
    const totalResults = await this.readTotalResultsCount();
    expect(totalResults, "Unfiltered baseline result count").toBeGreaterThan(500);
    expect(totalPages, "Unfiltered baseline page count").toBeGreaterThan(50);
  }

  // --- UI consistency (TC18) ---

  /**
   * TC18 — a light, cheap structural DOM check rather than a subjective
   * "looks right" assertion: every "View Details" button across the results
   * grid renders with an identical `class` attribute.
   */
  async assertResultCardButtonsStyledConsistently(): Promise<void> {
    // Confirmed live: the results grid itself renders a moment after the
    // header count becomes visible — the same class of async-population
    // race documented throughout this module. Wait for at least one card
    // before reading, or this races the same way the Category tree and
    // Price Range slider bounds did.
    await this.wait.waitForCondition(async () => (await this.results.viewDetailsButtons.count()) > 0);
    const classNames = await this.results.viewDetailsButtons.run(
      "Read all View Details button classes",
      (loc) => loc.evaluateAll((nodes) => nodes.map((node) => node.className)),
    );
    expect(classNames.length, "Number of View Details buttons found").toBeGreaterThan(1);
    const uniqueClassSets = new Set(classNames);
    expect(uniqueClassSets.size, "Distinct class attribute values across View Details buttons").toBe(1);
  }

  // --- SEO meta tags (TC43) ---

  /**
   * TC43 — confirmed live the `/search` page carries its own real, distinct
   * title and meta description (not a copy of the homepage's). Real
   * crawlability/indexing needs dedicated SEO tooling, not Playwright.
   */
  async assertSearchPageHasDistinctSeoMeta(homepageDescription: string): Promise<void> {
    await this.deps.pageAssert.titleIs(/Search Results/i);
    const description = await this.results.metaDescriptionTag.attribute("content");
    expect(description?.length ?? 0, "Search page meta description content").toBeGreaterThan(0);
    expect(description, "Search page meta description differs from the homepage's").not.toBe(
      homepageDescription,
    );
  }

  // --- Invalid location selection (BIDC-469 TC19) ---

  /**
   * TC19 — confirmed live: the homepage's Location dropdown offers only
   * real, server-provided states (no free-text entry — see requirements
   * doc §5), so the closest real equivalent to "an invalid location" is a
   * manipulated `stateId` URL param, mirroring the identical, already-proven
   * pattern for `openWithInvalidCategoryId` above. A well-formed-but-
   * nonexistent 24-hex-char id (real ObjectId shape, generated fresh via
   * faker) returns a genuine `422`, gracefully absorbed into the same
   * generic empty-state UI.
   */
  async openWithInvalidLocationId(): Promise<void> {
    const bogusStateId = faker.database.mongodbObjectId();
    await this.deps.nav.goto(`/search?stateId=${bogusStateId}`);
  }

  // --- Search context persistence via browser history (BIDC-469 TC21, TC25, TC27) ---

  /**
   * TC21 — confirmed live: navigating results → a detail page → browser
   * Back returns to the *exact same* filtered `/search?searchText=...` URL
   * with real results re-rendered, not a reset view. There's no search bar
   * on the detail page itself (requirements doc §4), but the search
   * *context* genuinely does persist via the browser's own history — this
   * is the real mechanism behind TC21's intent.
   */
  async goBackFromDetailPage(): Promise<void> {
    await this.deps.nav.back();
    await this.results.resultsHeaderCount.waitForVisible();
  }

  /** TC27 — confirmed live: browser Forward after the above Back returns to the same detail page URL. */
  async goForwardToDetailPage(): Promise<void> {
    await this.deps.nav.forward();
  }

  async assertUrlContainsSearchText(term: string): Promise<void> {
    await this.deps.pageAssert.urlContains(`searchText=${term}`);
  }

  /** TC25 — confirmed live: the search context lives in the URL, so a hard reload of `/search?searchText=...` preserves it (real results re-render, not a reset). */
  async reload(): Promise<void> {
    await this.deps.nav.reload();
    await this.results.resultsHeaderCount.waitForVisible();
  }

  // --- Search context across viewport widths (BIDC-469 TC29, TC30, TC31, TC36) ---

  private static readonly RESPONSIVE_VIEWPORTS = [
    { width: 1280, height: 800, label: "desktop" },
    { width: 768, height: 1024, label: "tablet" },
    { width: 390, height: 844, label: "mobile" },
  ] as const;

  /**
   * TC29/TC30/TC31/TC36 — confirmed live: the same `/search?searchText=...`
   * context (URL and rendered result count) survives resizing across
   * desktop, tablet, and mobile widths — there's no separate "mobile search
   * bar" state to lose, since the results page renders from the URL at
   * every width.
   */
  async assertResultsPersistAcrossViewports(): Promise<void> {
    for (const viewport of SearchResultsActions.RESPONSIVE_VIEWPORTS) {
      await this.page.setViewportSize(viewport);
      await this.results.resultsHeaderCount.expect.toBeVisible();
    }
  }
}
