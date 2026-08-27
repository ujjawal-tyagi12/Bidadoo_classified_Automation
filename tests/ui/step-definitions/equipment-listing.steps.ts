import { createBdd } from "playwright-bdd";
import { test } from "../support/test.js";
import { categoryChipText } from "../actions/FilterPanelActions.js";
import type { SortOption } from "../actions/SearchResultsActions.js";
import type { CategoryLeaf } from "../../api/restful/data/equipment-search.models.js";

const { Given, When, Then } = createBdd(test);

function requiredSharedData<T>(value: T | undefined, key: string): T {
  if (value === undefined) {
    throw new Error(`Missing shared scenario data for key: ${key}`);
  }
  return value;
}

Given("Admin is on the homepage", async ({ homeActions }) => {
  await homeActions.open();
});

Given("Admin is on the search results page", async ({ searchResultsActions }) => {
  await searchResultsActions.open();
});

When("Admin searches for a real equipment term", async ({ homeActions, state }) => {
  const term = await homeActions.searchForRealTerm();
  state.setSharedData("searchTerm", term);
});

When("Admin searches for a gibberish term with no results", async ({ homeActions, state }) => {
  const term = await homeActions.searchForGibberishTerm();
  state.setSharedData("gibberishTerm", term);
});

When("Admin opens a featured Shop by Category card", async ({ homeActions }) => {
  await homeActions.openFeaturedCategoryCard();
});

When("Admin opens the first result's detail page", async ({ searchResultsActions }) => {
  await searchResultsActions.openResultDetail();
});

When("Admin expands the {string} filter section", async ({ filterPanelActions }, label: string) => {
  await filterPanelActions.toggleSection(label);
});

When("Admin selects a real category leaf filter", async ({ filterPanelActions, state }) => {
  const leaf = await filterPanelActions.pickRealCategoryLeaf();
  state.setSharedData("categoryLeaf", leaf);
  await filterPanelActions.selectCategoryLeaf(leaf.path);
});

When("Admin selects two real category leaf filters", async ({ filterPanelActions, state }) => {
  const leaves = await filterPanelActions.pickRealCategoryLeaves(2);
  state.setSharedData("categoryLeaves", leaves);
  await filterPanelActions.selectCategoryLeaves(leaves.map((leaf) => leaf.path));
});

When("Admin selects a real top-level category", async ({ filterPanelActions }) => {
  const name = await filterPanelActions.pickRealTopLevelCategoryWithChildren();
  await filterPanelActions.selectCategoryNode(name);
});

When("Admin selects a real model filter", async ({ filterPanelActions, state }) => {
  const model = await filterPanelActions.pickRealModel();
  state.setSharedData("model", model);
  await filterPanelActions.selectModel(model);
});

When("Admin applies the filters", async ({ filterPanelActions }) => {
  await filterPanelActions.applyFilters();
});

When("Admin clears all filters from the sidebar", async ({ filterPanelActions }) => {
  await filterPanelActions.clearAllViaSidebar();
});

When("Admin removes the selected category leaf filter tag", async ({ searchResultsActions, state }) => {
  const leaf = requiredSharedData(state.getSharedData<CategoryLeaf>("categoryLeaf"), "categoryLeaf");
  await searchResultsActions.removeFilterTag(categoryChipText(leaf.path));
});

When("Admin records the baseline total pages", async ({ searchResultsActions, state }) => {
  const totalPages = await searchResultsActions.readTotalPages();
  state.setSharedData("baselinePages", totalPages);
});

When("Admin records the first result title", async ({ searchResultsActions, state }) => {
  const title = await searchResultsActions.readFirstResultTitle();
  state.setSharedData("firstResultTitle", title);
});

When("Admin sorts results by {string}", async ({ searchResultsActions }, sortOption: string) => {
  await searchResultsActions.sortBy(sortOption as SortOption);
});

Then("Verify the search results page is shown", async ({ searchResultsActions }) => {
  await searchResultsActions.assertResultsVisible();
});

Then("Verify the equipment detail breadcrumb is shown", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertBreadcrumbVisible();
});

Then("Verify the filters sidebar is visible", async ({ filterPanelActions }) => {
  await filterPanelActions.assertFiltersSidebarVisible();
});

Then("Verify the {string} filter section is collapsed", async ({ filterPanelActions }, label: string) => {
  await filterPanelActions.assertSectionCollapsed(label);
});

Then("Verify the {string} filter section is expanded", async ({ filterPanelActions }, label: string) => {
  await filterPanelActions.assertSectionExpanded(label);
});

Then("Verify at least one active filter remains", async ({ searchResultsActions }) => {
  await searchResultsActions.assertHasActiveFilters();
});

Then("Verify no active filters remain", async ({ searchResultsActions }) => {
  await searchResultsActions.assertNoActiveFilters();
});

Then("Verify the selected category leaf filter tag is shown", async ({ searchResultsActions, state }) => {
  const leaf = requiredSharedData(state.getSharedData<CategoryLeaf>("categoryLeaf"), "categoryLeaf");
  await searchResultsActions.assertFilterTagVisible(categoryChipText(leaf.path));
});

Then("Verify the selected category leaf filter tag is no longer shown", async ({ searchResultsActions, state }) => {
  const leaf = requiredSharedData(state.getSharedData<CategoryLeaf>("categoryLeaf"), "categoryLeaf");
  await searchResultsActions.assertFilterTagHidden(categoryChipText(leaf.path));
});

Then("Verify both selected category leaf filter tags are shown", async ({ searchResultsActions, state }) => {
  const leaves = requiredSharedData(state.getSharedData<CategoryLeaf[]>("categoryLeaves"), "categoryLeaves");
  await searchResultsActions.assertFilterTagsVisible(leaves.map((leaf) => categoryChipText(leaf.path)));
});

Then("Verify the overflow filter tag pill shows a real overflow count", async ({ searchResultsActions }) => {
  await searchResultsActions.assertOverflowPillShowsRealOverflow();
});

Then("Verify the total pages decreased from the baseline", async ({ searchResultsActions, state }) => {
  const baselinePages = requiredSharedData(state.getSharedData<number>("baselinePages"), "baselinePages");
  await searchResultsActions.assertTotalPagesDecreasedFrom(baselinePages);
});

Then("Verify all real sort options are available", async ({ searchResultsActions }) => {
  await searchResultsActions.assertSortOptionsAvailable();
});

Then("Verify the first result title changed", async ({ searchResultsActions, state }) => {
  const previousTitle = requiredSharedData(state.getSharedData<string>("firstResultTitle"), "firstResultTitle");
  await searchResultsActions.assertFirstResultTitleChanged(previousTitle);
});

Then("Verify the Price Range slider's minimum cannot reach its maximum", async ({ filterPanelActions }) => {
  await filterPanelActions.assertPriceMinCannotReachMax();
});

Then("Verify the empty state message is shown", async ({ searchResultsActions }) => {
  await searchResultsActions.assertEmptyStateVisible();
});

// --- Automate-P1 / Automate-P2 tiers (TC15-18, 20-22, 26, 30-31, 33, 36-37, 40, 43) ---

Given("Admin opens the search results page with the search API mocked to fail", async ({ searchResultsActions }) => {
  await searchResultsActions.openWithMockedSearchFailure();
});

Given("Admin opens the search results page with the search API mocked to time out", async ({ searchResultsActions }) => {
  await searchResultsActions.openWithMockedSearchTimeout();
});

Given("Admin opens the search results page with an invalid category id", async ({ searchResultsActions }) => {
  await searchResultsActions.openWithInvalidCategoryId();
});

When("Admin resizes the viewport to tablet width", async ({ filterPanelActions }) => {
  await filterPanelActions.setViewportSize(768, 1024);
});

When("Admin resizes the viewport to mobile width", async ({ filterPanelActions }) => {
  await filterPanelActions.setViewportSize(390, 844);
});

When("Admin rotates the viewport to landscape", async ({ filterPanelActions }) => {
  await filterPanelActions.setViewportSize(844, 390);
});

When("Admin loses network connectivity and applies the filters", async ({ filterPanelActions }) => {
  await filterPanelActions.applyFiltersWhileOffline();
});

When("Admin drags the price max thumb to its own maximum", async ({ filterPanelActions }) => {
  await filterPanelActions.assertPriceMaxCanReachOwnMaximum();
});

When("Admin drags the price min thumb to its own minimum", async ({ filterPanelActions }) => {
  await filterPanelActions.assertPriceMinCanReachOwnMinimum();
});

When("Admin attempts a search with symbols only", async ({ homeActions }) => {
  await homeActions.attemptSearchWithSymbolsOnly();
});

When("Admin records the homepage meta description", async ({ homeActions, state }) => {
  const description = await homeActions.readMetaDescription();
  state.setSharedData("homeMetaDescription", description);
});

Then("Verify the mobile Filters trigger button is visible", async ({ filterPanelActions }) => {
  await filterPanelActions.assertMobileFiltersTriggerVisible();
});

Then("Verify the mobile Filters trigger button is hidden", async ({ filterPanelActions }) => {
  await filterPanelActions.assertMobileFiltersTriggerHidden();
});

Then("Verify the filters sidebar is hidden", async ({ filterPanelActions }) => {
  await filterPanelActions.assertFiltersSidebarHidden();
});

Then("Verify the page went blank due to the lost connection", async ({ filterPanelActions }) => {
  await filterPanelActions.assertPageWentBlankOffline();
});

Then("Verify the results page still renders correctly after the filter action", async ({ searchResultsActions }) => {
  await searchResultsActions.assertResultsRenderWithoutError();
});

Then("Verify Admin is still on the homepage", async ({ homeActions }) => {
  await homeActions.assertStillOnHomepage();
});

Then("Verify the unfiltered baseline has a large number of results and pages", async ({ searchResultsActions }) => {
  await searchResultsActions.assertLargeUnfilteredBaseline();
});

Then("Verify keyboard Tab navigation shows a visible focus state", async ({ homeActions }) => {
  await homeActions.assertKeyboardTabNavigationHasVisibleFocus();
});

Then("Verify the View Details buttons are styled consistently", async ({ searchResultsActions }) => {
  await searchResultsActions.assertResultCardButtonsStyledConsistently();
});

Then("Verify a real touch tap opens the mobile filter overlay", async ({ filterPanelActions }) => {
  await filterPanelActions.assertMobileFilterOverlayOpensViaTap();
});

Then("Verify the homepage SEO meta tags are present", async ({ homeActions }) => {
  await homeActions.assertHomepageSeoMetaTagsPresent();
});

Then("Verify the search results page has distinct SEO meta tags", async ({ searchResultsActions, state }) => {
  const homeMetaDescription = requiredSharedData(
    state.getSharedData<string>("homeMetaDescription"),
    "homeMetaDescription",
  );
  await searchResultsActions.assertSearchPageHasDistinctSeoMeta(homeMetaDescription);
});

// --- Filters panel: structure, chrome & accessibility (FLT-001 through FLT-023) ---

Then("Verify the desktop Filters header has no close icon", async ({ filterPanelActions }) => {
  await filterPanelActions.assertDesktopHeaderHasNoCloseIcon();
});

When("Admin opens the mobile Filters overlay", async ({ filterPanelActions }) => {
  await filterPanelActions.openMobileFilterOverlay();
});

Then("Verify the mobile Filters overlay header is complete", async ({ filterPanelActions }) => {
  await filterPanelActions.assertMobileOverlayHeaderComplete();
});

When("Admin closes the mobile Filters overlay via its close icon", async ({ filterPanelActions }) => {
  await filterPanelActions.closeMobileFilterOverlayViaCloseIcon();
});

Then("Verify the mobile Filters overlay is closed", async ({ filterPanelActions }) => {
  await filterPanelActions.assertMobileFilterOverlayClosed();
});

When("Admin presses Escape", async ({ filterPanelActions }) => {
  await filterPanelActions.pressEscapeKey();
});

Then("Verify the mobile Filters overlay is still open", async ({ filterPanelActions }) => {
  await filterPanelActions.assertMobileFilterOverlayStillOpen();
});

Then("Verify the filter sections render in the real order with no Brands section", async ({ filterPanelActions }) => {
  await filterPanelActions.assertRealSectionOrderNoBrands();
});

Then("Verify a divider separates each filter section", async ({ filterPanelActions }) => {
  await filterPanelActions.assertSectionDividersCount();
});

Then("Verify the Apply Filters button stays pinned while scrolling", async ({ filterPanelActions }) => {
  await filterPanelActions.assertApplyFiltersButtonSticky();
});

Then("Verify the Category filter list is internally scrollable", async ({ filterPanelActions }) => {
  await filterPanelActions.assertSectionListScrollable("Category");
});

Then("Verify the Model filter list is internally scrollable", async ({ filterPanelActions }) => {
  await filterPanelActions.assertSectionListScrollable("Model");
});

Then("Verify the Category checkbox rows have consistent spacing", async ({ filterPanelActions }) => {
  await filterPanelActions.assertCategoryCheckboxRowSpacingConsistent();
});

Then("Verify Clear All with no filters selected does not error", async ({ filterPanelActions }) => {
  await filterPanelActions.assertClearAllWithNoFiltersDoesNotError();
});

Then("Verify Clear All applies without a separate Apply Filters click", async ({ filterPanelActions }) => {
  await filterPanelActions.assertClearAllAppliesImmediately();
});

Then("Verify the selected category leaf filter checkbox is checked", async ({ filterPanelActions, state }) => {
  const leaf = requiredSharedData(state.getSharedData<CategoryLeaf>("categoryLeaf"), "categoryLeaf");
  await filterPanelActions.assertCategoryLeafChecked(leaf.path[leaf.path.length - 1]!);
});

Then("Verify Category listing counts render as plain numbers", async ({ filterPanelActions }) => {
  await filterPanelActions.assertCategoryListingCountsAreBareNumbers();
});

Then("Verify Model listing counts render as plain numbers", async ({ filterPanelActions }) => {
  await filterPanelActions.assertModelListingCountsAreBareNumbers();
});

Then("Verify a zero-count category is selectable", async ({ filterPanelActions }) => {
  await filterPanelActions.assertZeroCountCategorySelectable();
});

Then("Verify all Location checkboxes are unchecked by default", async ({ filterPanelActions }) => {
  await filterPanelActions.assertAllLocationCheckboxesUncheckedByDefault();
});

Then("Verify the Hours-Miles unit label is the fixed compound label", async ({ filterPanelActions }) => {
  await filterPanelActions.assertUnitLabelIsFixedCompoundString();
});

When("Admin rapidly toggles a real category leaf filter", async ({ filterPanelActions }) => {
  await filterPanelActions.rapidlyToggleRealCategoryLeaf();
});

Then(
  "Verify keyboard Tab order moves through the Category section into the next section",
  async ({ filterPanelActions }) => {
    await filterPanelActions.assertKeyboardTabOrderCategoryIntoModel();
  },
);

Then("Verify a category checkbox toggles via the Space key", async ({ filterPanelActions }) => {
  await filterPanelActions.assertCheckboxKeyboardToggleViaSpace();
});

When("Admin selects the same category leaf filter again", async ({ filterPanelActions, state }) => {
  const leaf = requiredSharedData(state.getSharedData<CategoryLeaf>("categoryLeaf"), "categoryLeaf");
  await filterPanelActions.selectCategoryLeaf(leaf.path);
});

Then("Verify the selected category leaf filter tag appears exactly once", async ({ searchResultsActions, state }) => {
  const leaf = requiredSharedData(state.getSharedData<CategoryLeaf>("categoryLeaf"), "categoryLeaf");
  await searchResultsActions.assertFilterTagAppearsExactlyOnce(categoryChipText(leaf.path));
});

Then("Verify the viewport meta tag does not disable user zoom", async ({ homeActions }) => {
  await homeActions.assertViewportMetaAllowsZoom();
});

Then("Verify the homepage has exactly one H1 heading", async ({ homeActions }) => {
  await homeActions.assertExactlyOneH1();
});
