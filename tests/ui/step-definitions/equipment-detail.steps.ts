import { createBdd } from "playwright-bdd";
import { test } from "../support/test.js";
import { loadEquipmentDetailProps } from "@data/readers/index.js";

const { Given, When, Then, Before } = createBdd(test);

// Reuses "Given Admin is on the homepage" and "When Admin opens the first
// result's detail page" from equipment-listing.steps.ts — both are
// registered globally by playwright-bdd, so they are not redefined here.

/**
 * TC26 seeds a 50-image listing (login + wizard + 50-file upload + submit +
 * confirm + public search + open detail + open viewer) — confirmed live
 * this can approach or exceed the global 40s test timeout
 * (`config/playwright.config.ts`) well before `SearchResultsActions
 * .openResultDetailByExactTitle`'s own 60s search-index-lag retry budget
 * gets a chance to run out on its own terms. Scoped to this one scenario's
 * tag rather than raising the global timeout for every test.
 */
Before({ tags: "@TC26" }, async ({ pwTestInfo }) => {
  pwTestInfo.setTimeout(120000);
});

When("Admin searches for the equipment detail fixture {string}", async ({ homeActions }, term: string) => {
  await homeActions.searchFor(term);
});

When("Admin searches for the seeded equipment listing", async ({ homeActions, state }) => {
  const title = state.getSharedData<string>("seedListingTitle");
  if (!title) {
    throw new Error("Missing shared scenario data for key: seedListingTitle");
  }
  await homeActions.searchFor(title);
});

When("Admin opens the seeded equipment listing's detail page", async ({ searchResultsActions, state }) => {
  const title = state.getSharedData<string>("seedListingTitle");
  if (!title) {
    throw new Error("Missing shared scenario data for key: seedListingTitle");
  }
  await searchResultsActions.openResultDetailByExactTitle(title);
});

When("Admin opens the image viewer", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.openImageViewer();
});

When("Admin closes the image viewer", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.closeImageViewer();
});

When("Admin browses to the next image", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.browseToNextImage();
});

When("Admin browses to the previous image", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.browseToPreviousImage();
});

When("Admin opens the Contact Seller form", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.openContactSellerForm();
});

When("Admin fills the required Contact Seller fields with valid data", async ({ equipmentDetailActions }) => {
  const props = loadEquipmentDetailProps();
  await equipmentDetailActions.fillRequiredContactFields(props.validContactSeller);
});

When("Admin enters an invalid email in the Contact Seller form", async ({ equipmentDetailActions }) => {
  const props = loadEquipmentDetailProps();
  await equipmentDetailActions.fillContactEmail(props.invalidEmail);
});

When("Admin activates the Contact Seller button via keyboard", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.activateContactSellerButtonViaKeyboard();
});

Then("Verify the equipment detail sections are visible", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertDetailSectionsVisible();
});

Then("Verify the first thumbnail is selected", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertFirstThumbnailSelected();
});

Then("Verify the image viewer is visible", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertImageViewerVisible();
});

Then("Verify the image viewer is hidden", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertImageViewerHidden();
});

Then("Verify the active image index is {int}", async ({ equipmentDetailActions }, index: number) => {
  await equipmentDetailActions.assertActiveImageIndex(index);
});

Then("Verify Previous wraps from the first to the last image", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertPreviousWrapsFromFirstToLastImage();
});

Then("Verify Next wraps from the last to the first image", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertNextWrapsFromLastToFirstImage();
});

Then("Verify the image count is {int}", async ({ equipmentDetailActions }, count: number) => {
  await equipmentDetailActions.assertImageCount(count);
});

Then("Verify the seller information is visible", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertSellerInfoVisible();
});

Then("Verify the quick links open in a new tab", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertQuickLinksOpenInNewTab();
});

Then("Verify the Equipment Details section is visible", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertEquipmentDetailsSectionVisible();
});

Then("Verify the Features section is visible", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertFeaturesSectionVisible();
});

Then("Verify the Add-On Services CTAs are visible", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertAddOnServiceCtasVisible();
});

Then("Verify the Contact Seller form is visible", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertContactSellerFormVisible();
});

Then("Verify the Contact Seller Submit button is disabled", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertContactSubmitDisabled();
});

Then("Verify the Contact Seller Submit button is enabled", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertContactSubmitEnabled();
});

Then("Verify the invalid email message is shown", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertInvalidEmailMessageVisible();
});

Then("Verify the section headings have consistent styling", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertSectionHeadingStylingConsistent();
});

Then("Verify the seller's contact details are hidden for an anonymous visitor", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertMissingSellerContactDetailsForAnonymousVisitor();
});
