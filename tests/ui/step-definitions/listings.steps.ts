import { createBdd } from "playwright-bdd";
import { test } from "../support/test.js";
import { loadListingsProps } from "@data/readers/index.js";
import { truncateForTableDisplay, extractSafeSearchTerm } from "../actions/ListingsActions.js";

const { Given, When, Then } = createBdd(test);

Then("Verify the listings table is displayed", async ({ listingsActions }) => {
  await listingsActions.assertPaginationSummaryVisible();
});

Then("Verify the listings table shows the real columns", async ({ listingsActions }) => {
  await listingsActions.assertColumnsVisible();
});

Then("Verify the new draft listing's checkbox is disabled", async ({ assetInformationActions, listingsActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await listingsActions.assertRowCheckboxDisabled(validAssetInformation.title);
});

When("Admin checks the new listing's checkbox", async ({ assetInformationActions, listingsActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await listingsActions.toggleRowCheckbox(validAssetInformation.title);
});

Then("Verify the bulk Sell with bidadoo action becomes available", async ({ listingsActions }) => {
  await listingsActions.assertBulkSellWithBidadooButtonVisible();
});

When("Admin opens the new draft listing's action menu", async ({ assetInformationActions, listingsActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await listingsActions.openRowActionMenu(validAssetInformation.title);
});

When("Admin opens the new listing's action menu", async ({ assetInformationActions, listingsActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await listingsActions.openRowActionMenu(validAssetInformation.title);
});

Then("Verify the action menu shows Edit Listing", async ({ assetInformationActions, listingsActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await listingsActions.assertActionMenuItemVisible(validAssetInformation.title, "Edit Listing");
});

Then("Verify the action menu does not show Sell with bidadoo", async ({ assetInformationActions, listingsActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await listingsActions.assertActionMenuItemNotVisible(validAssetInformation.title, "Sell with bidadoo");
});

Then("Verify the action menu shows Sell with bidadoo", async ({ assetInformationActions, listingsActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await listingsActions.assertActionMenuItemVisible(validAssetInformation.title, "Sell with bidadoo");
});

Then("Verify the action menu shows View Listing", async ({ assetInformationActions, listingsActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await listingsActions.assertActionMenuItemVisible(validAssetInformation.title, "View Listing");
});

When("Admin clicks Edit Listing in the action menu", async ({ assetInformationActions, listingsActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await listingsActions.clickActionMenuItem(validAssetInformation.title, "Edit Listing");
});

Then("Verify the Edit Listing wizard is pre-filled with the listing's data", async ({ assetInformationActions, createEquipmentShellActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await createEquipmentShellActions.goToStep("Asset Information");
  await assetInformationActions.assertTitleInputHasValue(validAssetInformation.title);
});

When("Admin clicks Sell with bidadoo in the action menu", async ({ assetInformationActions, listingsActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await listingsActions.clickActionMenuItem(validAssetInformation.title, "Sell with bidadoo");
});

Then("Verify the Sell with bidadoo confirmation dialog is shown", async ({ listingsActions }) => {
  await listingsActions.assertSellConfirmationDialogVisible();
});

When("Admin cancels the Sell with bidadoo confirmation", async ({ listingsActions }) => {
  await listingsActions.cancelSellConfirmation();
});

Then("Verify the new listing is still Active", async ({ assetInformationActions, sellerDashboardActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await sellerDashboardActions.searchListings(validAssetInformation.title);
  await sellerDashboardActions.assertListingVisible(validAssetInformation.title);
});

When("Admin clicks the Price sort button", async ({ listingsActions }) => {
  await listingsActions.clickPriceSort();
});

When("Admin clicks the Updated Date sort button", async ({ listingsActions }) => {
  await listingsActions.clickUpdatedDateSort();
});

Then("Verify the listings table is still populated", async ({ listingsActions }) => {
  await listingsActions.assertTableStillPopulated();
});

When("Admin filters listings by Status {string}", async ({ listingsActions }, status: string) => {
  await listingsActions.openFilter();
  await listingsActions.filterByStatus(status);
});

Then("Verify the Status filter is applied", async ({ listingsActions }) => {
  await listingsActions.assertStatusFilterAppliedInUrl("Active");
});

When("Admin opens the Filter panel", async ({ listingsActions }) => {
  await listingsActions.openFilter();
});

Then("Verify the Price filter defaults to the full available range", async ({ listingsActions }) => {
  await listingsActions.assertPriceFilterDefaultsToFullRange();
});

When("Admin sets the Price filter to its minimum and maximum boundary values", async ({ listingsActions }) => {
  await listingsActions.setPriceFilterToBoundaryValues();
});

Then("Verify the Price filter range text reflects the boundary values", async ({ listingsActions }) => {
  await listingsActions.assertPriceFilterReflectsBoundaryValues();
});

When("Admin filters listings by a valid Listed On date range", async ({ listingsActions }) => {
  const from = new Date();
  from.setDate(from.getDate() - 7);
  const to = new Date();
  await listingsActions.filterByDateRange(from, to);
});

Then("Verify the Status filter dialog closes without error", async ({ listingsActions }) => {
  await listingsActions.assertPaginationSummaryVisible();
});

When("Admin picks a Listed On From date", async ({ listingsActions }) => {
  const from = new Date();
  from.setDate(from.getDate() - 7);
  await listingsActions.pickFilterFromDate(from);
});

Then("Verify the Listed On To date cannot be set earlier than From", async ({ listingsActions }) => {
  const beforeFrom = new Date();
  beforeFrom.setDate(beforeFrom.getDate() - 8);
  await listingsActions.assertToCalendarDayDisabled(beforeFrom);
});

When("Admin searches Listings for equipment that does not exist", async ({ sellerDashboardActions }) => {
  const { nonExistentSearchQuery } = loadListingsProps();
  await sellerDashboardActions.searchListings(nonExistentSearchQuery);
});

Then("Verify the no-listings-found message is shown", async ({ listingsActions }) => {
  await listingsActions.assertEmptyStateVisible();
});

Given("Admin logs out", async ({ loginActions }) => {
  await loginActions.logout();
});

When("Admin attempts to open the Listings page directly", async ({ listingsActions }) => {
  await listingsActions.openListingsDirectly();
});

Then("Verify Admin is redirected to the Login page", async ({ listingsActions }) => {
  await listingsActions.assertRedirectedToLogin();
});

When("Admin searches Listings for a SQL-injection-style string", async ({ sellerDashboardActions }) => {
  const { sqlInjectionSearchString } = loadListingsProps();
  await sellerDashboardActions.searchListings(sqlInjectionSearchString);
});

When("Admin searches Listings for an XSS-style string", async ({ sellerDashboardActions }) => {
  const { xssSearchString } = loadListingsProps();
  await sellerDashboardActions.searchListings(xssSearchString);
});

Then("Verify the listings page did not crash", async ({ listingsActions }) => {
  await listingsActions.assertPageDidNotCrash();
});

When("Admin fills in Asset Information with a special-characters Equipment Name", async ({ assetInformationActions }) => {
  const { specialCharsEquipmentName } = loadListingsProps();
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await assetInformationActions.fillAssetInformation({ ...validAssetInformation, title: specialCharsEquipmentName });
});

Then("Verify the special-characters listing name is displayed correctly", async ({ sellerDashboardActions }) => {
  const { specialCharsEquipmentName } = loadListingsProps();
  await sellerDashboardActions.searchListings(extractSafeSearchTerm(specialCharsEquipmentName));
  await sellerDashboardActions.assertListingVisible(specialCharsEquipmentName);
});

When("Admin fills in Asset Information with a long Equipment Name", async ({ assetInformationActions }) => {
  const { longEquipmentName } = loadListingsProps();
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await assetInformationActions.fillAssetInformation({ ...validAssetInformation, title: longEquipmentName });
});

Then("Verify the long listing name is displayed correctly", async ({ sellerDashboardActions }) => {
  const { longEquipmentName } = loadListingsProps();
  await sellerDashboardActions.searchListings(longEquipmentName);
  await sellerDashboardActions.assertListingVisible(truncateForTableDisplay(longEquipmentName));
});

When("Admin clicks Clear all", async ({ listingsActions }) => {
  await listingsActions.clearAllFilters();
});

Then("Verify no filters are applied", async ({ listingsActions }) => {
  await listingsActions.assertNoFiltersApplied();
});

When("Admin selects Status {string} without applying", async ({ listingsActions }, status: string) => {
  await listingsActions.selectStatusWithoutApplying(status);
});

When("Admin cancels the filter panel", async ({ listingsActions }) => {
  await listingsActions.cancelFilter();
});

Then("Verify the default page size is 10", async ({ listingsActions }) => {
  await listingsActions.assertDefaultPageSizeIsTen();
});

When("Admin updates the new listing's status to Expired", async ({ assetInformationActions, listingsActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await listingsActions.updateListingStatusToExpired(validAssetInformation.title);
});

Then("Verify the new listing's status is Expired", async ({ assetInformationActions, listingsActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await listingsActions.assertRowStatusIs(validAssetInformation.title, "Expired");
});

Then("Verify the action menu does not show View Listing", async ({ assetInformationActions, listingsActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await listingsActions.assertActionMenuItemNotVisible(validAssetInformation.title, "View Listing");
});

When(
  "Admin updates the Listing Title and Price",
  async ({ assetInformationActions, createEquipmentShellActions, pricingContactActions }) => {
    const { updatedEquipmentTitle, updatedEquipmentPrice } = loadListingsProps();
    await createEquipmentShellActions.goToStep("Asset Information");
    await assetInformationActions.updateTitle(updatedEquipmentTitle);
    await createEquipmentShellActions.goToStep("Pricing & Contact Details");
    await pricingContactActions.updatePrice(updatedEquipmentPrice);
  },
);

Then("Verify the listing reflects the updated name and price", async ({ listingsActions, sellerDashboardActions }) => {
  const { updatedEquipmentTitle, updatedEquipmentPrice } = loadListingsProps();
  await sellerDashboardActions.searchListings(updatedEquipmentTitle);
  await sellerDashboardActions.assertListingVisible(updatedEquipmentTitle);
  await listingsActions.assertRowPriceIs(updatedEquipmentTitle, updatedEquipmentPrice);
});

When("Admin clicks the new draft listing's Reference ID", async ({ assetInformationActions, listingsActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await listingsActions.clickReferenceId(validAssetInformation.title);
});

Then(
  "Verify the equipment opens in a read-only View Equipment mode",
  async ({ assetInformationActions, createEquipmentShellActions }) => {
    await createEquipmentShellActions.assertViewEquipmentHeadingVisible();
    await assetInformationActions.assertCategoryDisabled();
  },
);

When("Admin clicks the Edit button on the View Equipment page", async ({ createEquipmentShellActions }) => {
  await createEquipmentShellActions.clickEdit();
});
