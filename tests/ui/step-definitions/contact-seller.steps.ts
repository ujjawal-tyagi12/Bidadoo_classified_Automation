import { createBdd } from "playwright-bdd";
import { test } from "../support/test.js";
import { loadContactSellerValidationProps } from "@data/readers/index.js";

const { When, Then } = createBdd(test);

// Reuses "Given Admin is on the homepage", "When Admin searches for the
// equipment detail fixture {string}", "And Admin opens the first result's
// detail page", "And Admin opens/activates the Contact Seller form/button",
// and the Submit-state/invalid-email Then steps already registered globally
// by playwright-bdd from equipment-listing.steps.ts and equipment-detail.steps.ts.

When("Admin clicks Cancel in the Contact Seller form", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.cancelContactSellerForm();
});

Then("Verify the Contact Seller form is hidden", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertContactSellerFormHidden();
});

Then("Verify the First Name field only keeps letters and spaces as each character is typed", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertFirstNameFilterCases();
});

Then("Verify the Last Name field only keeps letters and spaces as each character is typed", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertLastNameFilterCases();
});

Then("Verify the Phone Number field only keeps digits as each character is typed", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertPhoneFilterCases();
});

Then("Verify the Email field trims leading and trailing spaces", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertEmailSpacesTrimmed();
});

Then("Verify email format validation matches the real inline message for each case", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertEmailValidationCases();
});

Then("Verify boundary-length First Name, Phone, and Email values are accepted in full", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertBoundaryLengthFieldsAcceptFullInput();
});

Then("Verify the Message field is pre-filled with {string}'s enquiry text", async ({ equipmentDetailActions }, title: string) => {
  await equipmentDetailActions.assertContactMessageDefaultText(title);
});

When("Admin clears the Contact Seller Message field", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.fillContactMessage("");
});

When("Admin replaces the Contact Seller Message with {string}", async ({ equipmentDetailActions }, message: string) => {
  await equipmentDetailActions.fillContactMessage(message);
});

When("Admin submits the Contact Seller form while offline", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.simulateOfflineContactSellerSubmit();
});

Then("Verify the Contact Seller form is unaffected by the offline submission attempt", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertContactSellerFormUnaffectedByOfflineSubmit();
});

Then("Verify the Contact Seller form is reset to its default state for {string}", async ({ equipmentDetailActions }, title: string) => {
  await equipmentDetailActions.assertContactSellerFormReset(title);
});

When("Admin fills the Contact Seller form with minimum-length values", async ({ equipmentDetailActions }) => {
  const { minLengthContact } = loadContactSellerValidationProps();
  await equipmentDetailActions.fillContactSellerForm(minLengthContact);
});

Then("Verify keyboard Tab moves focus through all Contact Seller fields in order", async ({ equipmentDetailActions }) => {
  await equipmentDetailActions.assertTabOrderThroughContactFields();
});
