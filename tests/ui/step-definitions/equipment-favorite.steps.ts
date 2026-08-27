import { createBdd } from "playwright-bdd";
import { test } from "../support/test.js";
import { ENV } from "@config/env.js";
import { loadEquipmentFavoriteProps } from "@data/readers/index.js";

const { Given, When, Then } = createBdd(test);

// Reuses "Given Admin logs in with valid credentials" (create-equipment.steps.ts),
// "Given Admin is on the search results page" and "When Admin opens the first
// result's detail page" (equipment-listing.steps.ts) — all registered globally
// by playwright-bdd, so they are not redefined here.

Given("Admin ensures the first result is not marked as favorite", async ({ favoriteActions }) => {
  await favoriteActions.ensureListingFavoriteState("OUTLINE");
});

Given("Admin ensures the first result is marked as favorite", async ({ favoriteActions }) => {
  await favoriteActions.ensureListingFavoriteState("FILLED");
});

When("Admin clicks the favorite icon on the first result", async ({ favoriteActions }) => {
  await favoriteActions.clickListingFavorite();
});

When("Admin clicks the favorite icon on the detail page", async ({ favoriteActions }) => {
  await favoriteActions.clickDetailFavorite();
});

When("Admin clicks the favorite icon on the first result {int} times rapidly", async ({ favoriteActions }, times: number) => {
  await favoriteActions.clickListingFavoriteRapidly(times);
});

When("Admin's session expires", async ({ favoriteActions }) => {
  await favoriteActions.simulateExpiredSession();
});

When("the favorite request is mocked to fail", async ({ favoriteActions }) => {
  await favoriteActions.mockFavoriteToggleFailure();
});

When("Admin signs in with valid credentials from the sign-in dialog", async ({ favoriteActions }) => {
  await favoriteActions.submitLogin(ENV.ADMIN_EMAIL, ENV.ADMIN_PASSWORD);
});

When("Admin enters an invalid email in the sign-in dialog", async ({ favoriteActions }) => {
  const props = loadEquipmentFavoriteProps();
  await favoriteActions.fillLoginEmail(props.invalidEmail);
});

When("Admin enters a valid email and a short password in the sign-in dialog", async ({ favoriteActions }) => {
  const props = loadEquipmentFavoriteProps();
  await favoriteActions.fillLoginEmail(props.specialCharEmail);
  await favoriteActions.fillLoginPassword(props.shortPassword);
});

When("Admin submits the sign-in dialog with a wrong password", async ({ favoriteActions }) => {
  const props = loadEquipmentFavoriteProps();
  await favoriteActions.submitLogin(ENV.ADMIN_EMAIL, props.wrongPassword);
});

When("Admin submits the sign-in dialog with a non-existent account", async ({ favoriteActions }) => {
  const props = loadEquipmentFavoriteProps();
  await favoriteActions.submitLogin(props.nonExistentEmail, "SomeValidLength123");
});

When(
  "Admin enters a special-character email and a valid password in the sign-in dialog",
  async ({ favoriteActions }) => {
    const props = loadEquipmentFavoriteProps();
    await favoriteActions.fillLoginEmail(props.specialCharEmail);
    await favoriteActions.fillLoginPassword("SomeValidLength123");
  },
);

When("Admin enters a long email and password in the sign-in dialog", async ({ favoriteActions }) => {
  await favoriteActions.fillLoginWithLongEmailAndPassword();
});

When("Admin enters an email but leaves the password empty in the sign-in dialog", async ({ favoriteActions }) => {
  const props = loadEquipmentFavoriteProps();
  await favoriteActions.fillLoginEmail(props.specialCharEmail);
});

When("Admin enters a password but leaves the email empty in the sign-in dialog", async ({ favoriteActions }) => {
  await favoriteActions.fillLoginPassword("SomeValidLength123");
});

Then("Verify the favorite icon on the first result shows as favorited", async ({ favoriteActions }) => {
  await favoriteActions.assertListingFavoriteFilled();
});

Then("Verify the favorite icon on the first result shows as not favorited", async ({ favoriteActions }) => {
  await favoriteActions.assertListingFavoriteOutline();
});

Then("Verify the favorite icon on the first result ends in a consistent state", async ({ favoriteActions }) => {
  await favoriteActions.assertListingFavoriteSettledToRecognizedState();
});

Then("Verify the detail page favorite icon shows as favorited", async ({ favoriteActions }) => {
  await favoriteActions.assertDetailFavoriteFilled();
});

Then("Verify the favorite icon on the first result persisted as favorited after a fresh login", async ({
  favoriteActions,
}) => {
  await favoriteActions.assertListingFavoritePersistedAfterFreshLogin();
});

Then("Verify the sign-in dialog is shown", async ({ favoriteActions }) => {
  await favoriteActions.assertLoginModalVisible();
});

Then("Verify the sign-in dialog is hidden", async ({ favoriteActions }) => {
  await favoriteActions.assertLoginModalHidden();
});

Then("Verify the sign-in dialog prompts to add the item to favorites", async ({ favoriteActions }) => {
  await favoriteActions.assertLoginModalPromptsForFavorite();
});

Then("Verify the sign-in dialog shows a generic sign-in prompt", async ({ favoriteActions }) => {
  await favoriteActions.assertLoginModalGenericSignInPrompt();
});

Then("Verify the Sign In button is disabled", async ({ favoriteActions }) => {
  await favoriteActions.assertSignInDisabled();
});

Then("Verify the Sign In button is enabled", async ({ favoriteActions }) => {
  await favoriteActions.assertSignInEnabled();
});

Then("Verify the invalid email message is shown in the sign-in dialog", async ({ favoriteActions }) => {
  await favoriteActions.assertInvalidEmailMessageVisible();
});

Then("Verify the short password message is shown in the sign-in dialog", async ({ favoriteActions }) => {
  await favoriteActions.assertShortPasswordMessageVisible();
});

Then("Verify the incorrect password message is shown", async ({ favoriteActions }) => {
  await favoriteActions.assertIncorrectPasswordMessageVisible();
});

Then("Verify the account not found message is shown", async ({ favoriteActions }) => {
  await favoriteActions.assertAccountNotFoundMessageVisible();
});

Then("Verify the favorite error toast is shown", async ({ favoriteActions }) => {
  await favoriteActions.assertFavoriteErrorToastVisible();
});
