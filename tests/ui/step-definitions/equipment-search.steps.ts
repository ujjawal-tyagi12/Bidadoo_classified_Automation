import { createBdd } from "playwright-bdd";
import { test } from "../support/test.js";

const { When, Then } = createBdd(test);

function requiredSharedData<T>(value: T | undefined, key: string): T {
  if (value === undefined) {
    throw new Error(`Missing shared scenario data for key: ${key}`);
  }
  return value;
}

When("Admin searches for a real equipment term and a real location", async ({ homeActions }) => {
  await homeActions.searchForRealTermAndLocation();
});

When("Admin searches using only a real location", async ({ homeActions }) => {
  await homeActions.searchByRealLocationOnly();
});

When("Admin searches using a partial real equipment term", async ({ homeActions }) => {
  await homeActions.searchForRealPartialTerm();
});

When("Admin searches using a real numeric equipment term", async ({ homeActions }) => {
  await homeActions.searchForRealNumericTerm();
});

When("Admin searches using a real hyphenated equipment term", async ({ homeActions }) => {
  await homeActions.searchForRealHyphenatedTerm();
});

When("Admin searches using a real mixed alphanumeric equipment term", async ({ homeActions }) => {
  await homeActions.searchForRealMixedAlphanumericTerm();
});

When("Admin searches using symbols only", async ({ homeActions }) => {
  await homeActions.attemptSearchWithSymbolsOnly();
});

When("Admin searches with an empty keyword and no location", async ({ homeActions }) => {
  await homeActions.searchWithNothingEntered();
});

When("Admin attempts to open the location dropdown while the location service is failing", async ({ homeActions }) => {
  await homeActions.mockLocationLoadFailureAndOpenDropdown();
});

When("Admin searches while the search service times out", async ({ homeActions }) => {
  await homeActions.attemptSearchDuringServiceTimeout();
});

When("Admin searches using a very long keyword", async ({ homeActions, state }) => {
  const term = await homeActions.searchWithVeryLongTerm();
  state.setSharedData("longSearchTerm", term);
});

When("Admin selects a real location filter", async ({ filterPanelActions, state }) => {
  const stateName = await filterPanelActions.pickRealLocation();
  state.setSharedData("changedLocationName", stateName);
  await filterPanelActions.selectLocation(stateName);
});

When("Admin navigates back to the previous page", async ({ homeActions }) => {
  await homeActions.goBackToHomepage();
});

Then("Verify the location dropdown shows no options and no error", async ({ homeActions }) => {
  await homeActions.assertLocationDropdownEmptyWithNoError();
});

Then("Verify Admin remains on the homepage with no error shown", async ({ homeActions }) => {
  await homeActions.assertStillOnHomepage();
});

Then("Verify the full keyword was submitted without truncation", async ({ homeActions, state }) => {
  const term = requiredSharedData(state.getSharedData<string>("longSearchTerm"), "longSearchTerm");
  await homeActions.assertFullTermSubmitted(term);
});

Then("Verify the newly selected location filter tag is shown", async ({ searchResultsActions, state }) => {
  const stateName = requiredSharedData(state.getSharedData<string>("changedLocationName"), "changedLocationName");
  await searchResultsActions.assertFilterTagVisible(stateName);
});

Then("Verify the search suggestions panel is static regardless of input", async ({ homeActions }) => {
  await homeActions.assertSuggestionsPanelIsStaticRegardlessOfInput();
});

Then("Verify the location dropdown loads its full list of states and provinces", async ({ homeActions }) => {
  await homeActions.assertLocationDropdownLoadsFullList();
});

Then("Verify the homepage search input is empty", async ({ homeActions }) => {
  await homeActions.assertSearchInputEmpty();
});

// --- Re-examined "non-applicable" cases with real equivalents ---

When("Admin types a keyword without clicking Search", async ({ homeActions }) => {
  await homeActions.typeWithoutSearching("Ex");
});

When("Admin clears all filters via the tag bar", async ({ searchResultsActions }) => {
  await searchResultsActions.clearAllViaTagBar();
});

When("Admin selects a real location starting with {string}", async ({ homeActions, state }, prefix: string) => {
  const name = await homeActions.selectLocationStartingWith(prefix);
  state.setSharedData("selectedLocationName", name);
});

Then("Verify the selected location is displayed in the Location field", async ({ homeActions, state }) => {
  const name = requiredSharedData(state.getSharedData<string>("selectedLocationName"), "selectedLocationName");
  await homeActions.assertLocationSelected(name);
});

When("Admin navigates directly to search results with an invalid location id", async ({ searchResultsActions }) => {
  await searchResultsActions.openWithInvalidLocationId();
});

When("Admin navigates forward to the detail page", async ({ searchResultsActions }) => {
  await searchResultsActions.goForwardToDetailPage();
});

When("Admin refreshes the results page", async ({ searchResultsActions }) => {
  await searchResultsActions.reload();
});

Then("Verify the search results remain visible across desktop, tablet, and mobile widths", async ({ searchResultsActions }) => {
  await searchResultsActions.assertResultsPersistAcrossViewports();
});
