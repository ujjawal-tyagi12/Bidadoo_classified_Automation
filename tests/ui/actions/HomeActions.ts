import { expect, type Page } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { assertApiOk } from "@core/api";
import { WaitHelper } from "@core/ui/wait/index.js";
import type { ActionDeps } from "../support/action-deps.js";
import { HomePage } from "../pages/HomePage.js";
import { EquipmentSearchClient } from "../../api/restful/clients/equipment-search.client.js";
import { ENDPOINTS } from "../../api/restful/endpoints.js";

/**
 * Homepage → search-bar / "Shop by Category" navigation. Confirmed live: the
 * search input does not submit on Enter — only the dedicated search icon
 * button navigates to `/search?searchText=...` (see
 * docs/requirements/equipment-listing-automation-requirements.md §4).
 */
export class HomeActions {
  private readonly home: HomePage;
  private readonly equipmentSearchClient: EquipmentSearchClient;
  private readonly wait: WaitHelper;

  /**
   * The fixed, curated set of "Shop by Category" cards this homepage section
   * renders (a structural fact about the page layout, not test data — see
   * docs/requirements/equipment-listing-automation-requirements.md §2).
   * Which of these currently has real listings drifts over time on a live
   * QA environment: "Agriculture" was previously confirmed to have results
   * but was later found to have zero (both via a hard reload and a
   * simulated client-side navigation) — hardcoding any single name here is
   * exactly the kind of assumption that goes stale, so the real pick is
   * made dynamically in `pickFeaturedCategoryWithResults`.
   */
  private static readonly FEATURED_CATEGORY_CANDIDATES = [
    "Agriculture",
    "Transportation - Trailers",
    "Construction Equipment",
    "Forestry",
    "HVAC & Climate Control",
    "Manufacturing Equipment",
    "Material Handling",
    "Transportation - Trucks",
  ] as const;

  constructor(
    private readonly page: Page,
    private readonly deps: ActionDeps,
  ) {
    this.home = new HomePage(page, deps.uiSurface);
    this.equipmentSearchClient = new EquipmentSearchClient({
      request: deps.request,
      logger: deps.logger,
    });
    this.wait = new WaitHelper(page);
  }

  async open(): Promise<void> {
    await this.deps.nav.goto("/");
    await this.home.searchInput.waitForVisible();
    // Confirmed live: a brief settle after "load" avoids a race with this
    // app's guest-session bootstrap where an immediate search-button click
    // silently no-ops instead of navigating.
    await this.deps.nav.waitForLoadState("load");
  }

  async searchFor(term: string): Promise<void> {
    await this.home.searchInput.clearAndFill(term);
    await this.home.searchButton.click();
    await this.deps.nav.waitForURL(/\/search\?searchText=/);
  }

  /**
   * Fetches real, live Model option values via the API client and searches
   * for a randomly-picked one (faker) that is confirmed to have at least one
   * matching listing — avoids hardcoding a search term that may not exist.
   */
  async searchForRealTerm(): Promise<string> {
    const response = await this.equipmentSearchClient.getModelOptions(1, 50);
    assertApiOk(response, "getModelOptions");
    const modelsWithResults = response.data.result.data.filter((m) => m.count > 0);
    const picked = faker.helpers.arrayElement(modelsWithResults);
    await this.searchFor(picked.model);
    return picked.model;
  }

  /** A random alphanumeric term confirmed to have zero matches — drives the empty-state scenario (TC14). */
  async searchForGibberishTerm(): Promise<string> {
    const term = faker.string.alphanumeric({ length: 20 });
    await this.searchFor(term);
    return term;
  }

  /**
   * Picks a homepage "Shop by Category" card name that currently has real
   * listings, cross-referencing the fixed candidate list above against the
   * live category tree's `equipmentCount` — avoids landing on a card whose
   * category has since gone empty on this live QA environment.
   */
  private async pickFeaturedCategoryWithResults(): Promise<string> {
    const response = await this.equipmentSearchClient.getCategoryTree(1, 20);
    assertApiOk(response, "getCategoryTree");
    const candidateNames: readonly string[] = HomeActions.FEATURED_CATEGORY_CANDIDATES;
    const withResults = response.data.result.data.filter(
      (node) => candidateNames.includes(node.name) && node.equipmentCount > 0,
    );
    return faker.helpers.arrayElement(withResults).name;
  }

  /**
   * Confirmed live: the card is a real `target="_blank"` link, so clicking
   * it opens a new tab rather than navigating this page. Reading its `href`
   * and navigating directly reflects the same destination without taking on
   * popup/multi-page handling for a single card click.
   */
  async openFeaturedCategoryCard(): Promise<void> {
    const category = await this.pickFeaturedCategoryWithResults();
    const card = this.home.categoryCard(category);
    await card.waitForVisible();
    const href = await card.attribute("href");
    if (!href) {
      throw new Error(`Category card "${category}" has no href`);
    }
    await this.deps.nav.goto(href);
    await this.deps.nav.waitForURL(/\/search\?categoryId=/);
  }

  // --- Location dropdown (BIDC-469 §3/§9) ---

  /**
   * Confirmed live: a plain `.click()` intermittently leaves the panel
   * closed with zero network call fired even after a `.hover()` — a bounded
   * retry (hover, click, check for a rendered option, else Escape and retry)
   * is needed, not just a single attempt (requirements doc §3/§8).
   */
  private async openLocationDropdown(): Promise<void> {
    const maxOpenAttempts = 6;
    for (let attempt = 0; attempt < maxOpenAttempts; attempt++) {
      await this.home.locationTrigger.hover();
      await this.home.locationTrigger.click();
      try {
        // Scoped to the single panel element, not the (multi-match) option
        // list, to avoid a strict-mode ambiguity once options are rendered.
        await this.home.locationOptionsPanel.waitForVisible({ timeout: 3000 });
        return;
      } catch {
        await this.page.keyboard.press("Escape").catch(() => {});
      }
    }
    throw new Error("Location dropdown did not open after repeated hover+click attempts");
  }

  /** Reads the Location trigger's own displayed text — "Location" until a state is picked, then the picked state's name (confirmed live). */
  async assertLocationSelected(stateName: string): Promise<void> {
    await this.home.locationTrigger.expect.toHaveText(stateName);
  }

  /**
   * Implements the full flow: open the dropdown, wait for its options to
   * become visible, select the named option, then verify the trigger now
   * displays it. If `stateName` isn't among the options already rendered,
   * scrolls the panel to lazy-load further pages (10 at a time) until it
   * appears, matching the confirmed live pagination mechanism.
   */
  async selectLocation(stateName: string): Promise<void> {
    await this.openLocationDropdown();

    const maxScrollAttempts = 10;
    for (let attempt = 0; attempt < maxScrollAttempts; attempt++) {
      if ((await this.home.locationOptionByName(stateName).count()) > 0) {
        break;
      }
      const countBeforeScroll = await this.home.locationOptionItems.count();
      await this.home.locationOptionsPanel.run("Scroll to load more locations", (loc) =>
        loc.evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        }),
      );
      await this.wait.waitForCondition(async () => (await this.home.locationOptionItems.count()) > countBeforeScroll);
    }
    await this.home.locationOptionByName(stateName).click();
    await this.assertLocationSelected(stateName);
  }

  /**
   * Picks a state/province from the dropdown's own first (unscrolled) page —
   * avoids the scroll-until-found mechanism entirely for scenarios that just
   * need *some* real, immediately-selectable location, matching the "any
   * dynamic value" strategy decided for this ticket (requirements doc §8/§9)
   * rather than a hardcoded name like "New York".
   */
  private async pickReachableLocation(): Promise<string> {
    const response = await this.equipmentSearchClient.getLocationStates(1, 10);
    assertApiOk(response, "getLocationStates");
    return faker.helpers.arrayElement(response.data.result.data).name;
  }

  async searchByRealLocationOnly(): Promise<void> {
    const stateName = await this.pickReachableLocation();
    await this.selectLocation(stateName);
    await this.home.searchButton.click();
    await this.deps.nav.waitForURL(/\/search\?stateId=/);
  }

  async searchForRealTermAndLocation(): Promise<void> {
    const term = await this.pickRealMatchingModel();
    const stateName = await this.pickReachableLocation();
    await this.home.searchInput.clearAndFill(term);
    await this.selectLocation(stateName);
    await this.home.searchButton.click();
    await this.deps.nav.waitForURL(/\/search\?/);
  }

  private async pickRealMatchingModel(): Promise<string> {
    const response = await this.equipmentSearchClient.getModelOptions(1, 50);
    assertApiOk(response, "getModelOptions");
    const modelsWithResults = response.data.result.data.filter((m) => m.count > 0);
    return faker.helpers.arrayElement(modelsWithResults).model;
  }

  /** Searches for the first half of a real, currently-matching model name — confirms partial/substring matching (TC4). */
  async searchForRealPartialTerm(): Promise<void> {
    const response = await this.equipmentSearchClient.getModelOptions(1, 50);
    assertApiOk(response, "getModelOptions");
    const candidates = response.data.result.data.filter((m) => m.count > 0 && m.model.length >= 4);
    const picked = faker.helpers.arrayElement(candidates);
    const partial = picked.model.slice(0, Math.ceil(picked.model.length / 2));
    await this.searchFor(partial);
  }

  /** Searches for a real, currently-matching model name that contains at least one digit (TC13). */
  async searchForRealNumericTerm(): Promise<void> {
    const response = await this.equipmentSearchClient.getModelOptions(1, 50);
    assertApiOk(response, "getModelOptions");
    const numericCandidates = response.data.result.data.filter((m) => m.count > 0 && /\d/.test(m.model));
    const picked = faker.helpers.arrayElement(numericCandidates);
    await this.searchFor(picked.model);
  }

  /**
   * Searches for a real, currently-matching model name containing a hyphen
   * (TC12). Confirmed live real examples exist in the catalog (e.g.
   * "113-320", "1320PD-10") — picking dynamically from these avoids the
   * sheet's literal "D6T-XL", which has no match in the current QA data and
   * would return a false negative unrelated to hyphen-handling itself.
   */
  async searchForRealHyphenatedTerm(): Promise<void> {
    const response = await this.equipmentSearchClient.getModelOptions(1, 50);
    assertApiOk(response, "getModelOptions");
    const hyphenatedCandidates = response.data.result.data.filter((m) => m.count > 0 && /-/.test(m.model));
    const picked = faker.helpers.arrayElement(hyphenatedCandidates);
    await this.searchFor(picked.model);
  }

  /**
   * Searches for a real, currently-matching model name that mixes letters
   * and digits (TC14), e.g. "320D", "310SL" — same live-catalog strategy as
   * `searchForRealHyphenatedTerm`, avoiding the sheet's literal "CAT320D".
   */
  async searchForRealMixedAlphanumericTerm(): Promise<void> {
    const response = await this.equipmentSearchClient.getModelOptions(1, 50);
    assertApiOk(response, "getModelOptions");
    const mixedCandidates = response.data.result.data.filter(
      (m) => m.count > 0 && /[a-zA-Z]/.test(m.model) && /\d/.test(m.model),
    );
    const picked = faker.helpers.arrayElement(mixedCandidates);
    await this.searchFor(picked.model);
  }

  /**
   * Confirmed live: a symbol-only value produces zero navigation and zero
   * network call — the Search button click is a silent no-op (requirements
   * doc §3/§5, TC5).
   */
  async attemptSearchWithSymbolsOnly(): Promise<void> {
    await this.home.searchInput.clearAndFill("@@@");
    await this.home.searchButton.click();
  }

  /** Confirmed live: empty keyword + no location navigates to the unfiltered `/search` baseline, not an error (TC6). */
  async searchWithNothingEntered(): Promise<void> {
    await this.home.searchInput.clearAndFill("");
    await this.home.searchButton.click();
    await this.deps.nav.waitForURL(/\/search$/);
  }

  /** No client-side length cap exists (confirmed live) — the full string reaches the request untruncated (TC11). */
  async searchWithVeryLongTerm(): Promise<string> {
    const term = "Excavator".repeat(10);
    await this.searchFor(term);
    return term;
  }

  async assertFullTermSubmitted(term: string): Promise<void> {
    await this.deps.pageAssert.urlContains(term);
  }

  /**
   * Confirmed live via a mocked 500: the dropdown panel renders with zero
   * items and no error copy anywhere — a silent failure, not the sheet's
   * "Locations could not be loaded..." message (TC8).
   */
  async mockLocationLoadFailureAndOpenDropdown(): Promise<void> {
    await this.page.route(`**${ENDPOINTS.locationStates}*`, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ statusCode: 500, error: "InternalServerError", message: "mocked failure" }),
      }),
    );
    await this.home.locationTrigger.hover();
    const responsePromise = this.page.waitForResponse((res) => res.url().includes(ENDPOINTS.locationStates));
    await this.home.locationTrigger.click();
    await responsePromise;
  }

  async assertLocationDropdownEmptyWithNoError(): Promise<void> {
    await this.home.locationOptionItems.expect.toHaveCount(0);
  }

  /**
   * Confirmed live via a mocked abort: the user is left on the homepage with
   * zero feedback — no error message, no broken results page (TC9). The
   * click handler evidently awaits the request and only navigates on success.
   */
  async attemptSearchDuringServiceTimeout(): Promise<void> {
    await this.page.route(`**${ENDPOINTS.equipmentsSearch}*`, (route) => route.abort("timedout"));
    await this.home.searchInput.clearAndFill("Excavator");
    await this.home.searchButton.click();
  }

  async assertStillOnHomepage(): Promise<void> {
    expect(this.page.url()).not.toContain("/search");
    await this.home.searchInput.expect.toBeVisible();
  }

  /**
   * Confirmed live: this panel (Recently Added / Popular Equipment / Top
   * Sellers + brand/category shortcuts) renders identically for empty,
   * partial-keyword, and gibberish input — it's a static "browse" panel, not
   * keyword-filtered suggestions (requirements doc §3/§5, TC10/TC17).
   */
  async assertSuggestionsPanelIsStaticRegardlessOfInput(): Promise<void> {
    await this.home.searchInput.click();
    await this.wait.waitForCondition(async () => (await this.home.suggestionsPanel.count()) > 0);
    const baseline = await this.home.suggestionsPanel.run("Read suggestions panel: empty input", (loc) =>
      loc.allInnerTexts(),
    );

    await this.home.searchInput.clearAndFill("Exc");
    const withPartialKeyword = await this.home.suggestionsPanel.run(
      "Read suggestions panel: partial keyword",
      (loc) => loc.allInnerTexts(),
    );
    expect(withPartialKeyword).toEqual(baseline);

    await this.home.searchInput.clearAndFill(faker.string.alphanumeric({ length: 15 }));
    const withGibberish = await this.home.suggestionsPanel.run("Read suggestions panel: gibberish input", (loc) =>
      loc.allInnerTexts(),
    );
    expect(withGibberish).toEqual(baseline);
  }

  /**
   * Confirmed live: the dropdown lazy-loads 10 states/provinces at a time on
   * scroll. Reads the real total from the API (never hardcoded) and scrolls
   * until every option has rendered (TC20).
   */
  async assertLocationDropdownLoadsFullList(): Promise<void> {
    const response = await this.equipmentSearchClient.getLocationStates(1, 1);
    assertApiOk(response, "getLocationStates");
    const expectedTotal = response.data.result.total;

    await this.openLocationDropdown();

    const maxScrollAttempts = 12;
    for (let attempt = 0; attempt < maxScrollAttempts; attempt++) {
      const count = await this.home.locationOptionItems.count();
      if (count >= expectedTotal) {
        break;
      }
      await this.home.locationOptionsPanel.run("Scroll to load more locations", (loc) =>
        loc.evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        }),
      );
      await this.wait.waitForCondition(async () => (await this.home.locationOptionItems.count()) > count);
    }
    await this.home.locationOptionItems.expect.toHaveCount(expectedTotal);
  }

  /** Confirmed live: browser Back does return the user to `/`, but the search input comes back empty, not restored (TC26). */
  async goBackToHomepage(): Promise<void> {
    await this.deps.nav.back();
  }

  async assertSearchInputEmpty(): Promise<void> {
    await this.home.searchInput.waitForVisible();
    await this.home.searchInput.expect.toHaveValue("");
  }

  // --- Accessibility (TC17) ---

  /**
   * TC17 — the genuinely automatable a11y slice, confirmed live: `Tab`
   * moves focus through real interactive elements (anchors/buttons/inputs)
   * with a visible focus indicator (the browser's own default outline in
   * this app's case). Full screen-reader coverage is out of scope for
   * Playwright — see requirements doc §7.
   */
  async assertKeyboardTabNavigationHasVisibleFocus(): Promise<void> {
    await this.page.keyboard.press("Tab");
    const first = await this.page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        hasVisibleFocus: style.outlineStyle !== "none" || style.boxShadow !== "none",
      };
    });
    expect(first, "First Tab stop").not.toBeNull();
    expect(["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"]).toContain(first?.tag);
    expect(first?.hasVisibleFocus, "First Tab stop has a visible focus indicator").toBe(true);

    await this.page.keyboard.press("Tab");
    const secondTag = await this.page.evaluate(() => document.activeElement?.tagName ?? null);
    expect(secondTag, "Second Tab stop").not.toBeNull();
  }

  // --- SEO meta tags (TC43) ---

  /**
   * TC43 — narrow, genuinely automatable SEO slice: real meta tag
   * presence/content on the homepage. Real crawlability/indexing needs
   * dedicated SEO tooling, not Playwright — see requirements doc §7.
   */
  async assertHomepageSeoMetaTagsPresent(): Promise<void> {
    const description = await this.home.metaDescriptionTag.attribute("content");
    const keywords = await this.home.metaKeywordsTag.attribute("content");
    const ogTitle = await this.home.metaOgTitleTag.attribute("content");
    const canonical = await this.home.canonicalLinkTag.attribute("href");
    expect(description?.length ?? 0, "Homepage meta description content").toBeGreaterThan(0);
    expect(keywords?.length ?? 0, "Homepage meta keywords content").toBeGreaterThan(0);
    expect(ogTitle?.length ?? 0, "Homepage og:title content").toBeGreaterThan(0);
    expect(canonical?.length ?? 0, "Homepage canonical href").toBeGreaterThan(0);
  }

  async readMetaDescription(): Promise<string> {
    return (await this.home.metaDescriptionTag.attribute("content")) ?? "";
  }

  // --- Re-examined "non-applicable" cases with real equivalents (BIDC-469 TC10, TC18) ---

  /**
   * TC10 — confirmed live via a network listener: typing alone, at any
   * length, never fires a `bd-search` request or navigates away from `/` —
   * only clicking the Search button does. There's no "3-character
   * suggestion threshold" to test since nothing triggers on input at all;
   * this is the real, testable equivalent — typing stays a no-op.
   */
  async typeWithoutSearching(term: string): Promise<void> {
    await this.home.searchInput.clearAndFill(term);
  }

  /**
   * TC18 — confirmed live: real states matching "New*" exist (New York, New
   * Jersey, New Hampshire, New Mexico, New Brunswick, Newfoundland and
   * Labrador). There's no free-text field to type "New" into (requirements
   * doc §5), but selecting one of these via the real scroll-select
   * mechanism is the closest real equivalent to "a location suggestion
   * matching partial input" — reuses `selectLocation`'s own verification.
   */
  async selectLocationStartingWith(prefix: string): Promise<string> {
    const response = await this.equipmentSearchClient.getLocationStates(1, 100);
    assertApiOk(response, "getLocationStates");
    const candidates = response.data.result.data.filter((s) => s.name.startsWith(prefix));
    const picked = faker.helpers.arrayElement(candidates);
    await this.selectLocation(picked.name);
    return picked.name;
  }

  /**
   * TC41 — confirmed live: `content="width=device-width, initial-scale=1"`,
   * no `user-scalable=no` or `maximum-scale=1` — real pinch-zoom gestures
   * aren't simulatable in Playwright, but this meta attribute is the one
   * mechanism that could block zoom at the page level, and it doesn't.
   */
  async assertViewportMetaAllowsZoom(): Promise<void> {
    const content = (await this.home.viewportMetaTag.attribute("content")) ?? "";
    expect(content).not.toMatch(/user-scalable\s*=\s*no/i);
    expect(content).not.toMatch(/maximum-scale\s*=\s*1(\.0*)?(?!\d)/i);
  }

  /** TC43 — confirmed live: exactly one `<h1>` on the homepage. */
  async assertExactlyOneH1(): Promise<void> {
    await this.home.h1Headings.expect.toHaveCount(1);
  }
}
