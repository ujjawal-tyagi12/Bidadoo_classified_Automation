import { faker } from "@faker-js/faker";
import { createBdd } from "playwright-bdd";
import { test } from "../support/test.js";
import { ENV } from "@config/env.js";
import { loadLoginProps } from "@data/readers/index.js";

const { Given, When, Then } = createBdd(test);

const wellFormedEmail = () => faker.internet.email();
const validLengthPassword = () => faker.internet.password({ length: 12 });
const wrongPassword = () => faker.internet.password({ length: 12 });
const unregisteredEmail = () => faker.internet.email();

Given("Admin is on the Login page", async ({ loginActions }) => {
  await loginActions.openLoginPage();
});

Then("Verify the Login button is disabled", async ({ loginActions }) => {
  await loginActions.assertLoginButtonDisabled();
});

Then("Verify the Login button is enabled", async ({ loginActions }) => {
  await loginActions.assertLoginButtonEnabled();
});

When("Admin fills in a well-formed Email and Password", async ({ loginActions }) => {
  await loginActions.fillCredentials(wellFormedEmail(), validLengthPassword());
});

When("Admin fills in Login credentials with an invalid Email format", async ({ loginActions }) => {
  const { invalidEmailFormat } = loadLoginProps();
  await loginActions.fillCredentials(invalidEmailFormat, validLengthPassword());
});

Then("Verify the email format error is shown", async ({ loginActions }) => {
  await loginActions.assertEmailFormatErrorVisible();
});

When("Admin fills in Login credentials with a Password under the minimum length", async ({ loginActions }) => {
  const { underMinimumPassword } = loadLoginProps();
  await loginActions.fillCredentials(wellFormedEmail(), underMinimumPassword);
});

Then("Verify the password length error is shown", async ({ loginActions }) => {
  await loginActions.assertPasswordLengthErrorVisible();
});

When("Admin attempts to log in with the wrong Password", async ({ loginActions }) => {
  await loginActions.attemptLoginWith(ENV.ADMIN_EMAIL, wrongPassword());
});

Then("Verify the incorrect password error is shown", async ({ loginActions }) => {
  await loginActions.assertIncorrectPasswordErrorVisible();
});

When("Admin attempts to log in with an unregistered Email", async ({ loginActions }) => {
  await loginActions.attemptLoginWith(unregisteredEmail(), validLengthPassword());
});

Then("Verify the account not found error is shown", async ({ loginActions }) => {
  await loginActions.assertAccountNotFoundErrorVisible();
});

Then("Verify the Password field is masked", async ({ loginActions }) => {
  await loginActions.assertPasswordMasked();
});

When("Admin toggles password visibility", async ({ loginActions }) => {
  await loginActions.togglePasswordVisibility();
});

Then("Verify the Password field is visible", async ({ loginActions }) => {
  await loginActions.assertPasswordVisible();
});

When("Admin checks Remember Me", async ({ loginActions }) => {
  await loginActions.toggleRememberMe();
});

Then("Verify Remember Me is checked", async ({ loginActions }) => {
  await loginActions.assertRememberMeChecked();
});
