import { createBdd } from "playwright-bdd";
import { test } from "../support/test.js";
import { loadCustomAttributesProps } from "@data/readers/index.js";

const { Given, When, Then } = createBdd(test);

Given("Admin opens the Custom Attributes tab", async ({ customAttributesActions }) => {
  await customAttributesActions.openCustomAttributesDirectly();
});

When("Admin starts creating a new custom attribute", async ({ customAttributesActions }) => {
  await customAttributesActions.clickNewCustomAttribute();
});

When("Admin fills in the Attribute Name", async ({ customAttributesActions }) => {
  const name = await customAttributesActions.getOrCreateAttributeName();
  await customAttributesActions.fillName(name);
});

When("Admin selects Attribute type {string}", async ({ customAttributesActions }, type: string) => {
  await customAttributesActions.selectType(type);
});

When("Admin fills Value 1 with {string}", async ({ customAttributesActions }, value: string) => {
  await customAttributesActions.fillValue(1, value);
});

When("Admin submits the custom attribute form", async ({ customAttributesActions }) => {
  await customAttributesActions.clickSubmit();
});

Then("Verify the new custom attribute appears in the list as Active", async ({ customAttributesActions }) => {
  const name = await customAttributesActions.getOrCreateAttributeName();
  await customAttributesActions.assertAttributeVisible(name);
  await customAttributesActions.assertRowStatusIs(name, "Active");
});

When("Admin blurs the Attribute Name field without entering a value", async ({ customAttributesActions }) => {
  await customAttributesActions.blurNameField();
});

Then("Verify the Attribute Name required error is shown", async ({ customAttributesActions }) => {
  await customAttributesActions.assertNameAlertVisible("Attribute Name is required");
});

Then("Verify the custom attribute form cannot be submitted", async ({ customAttributesActions }) => {
  await customAttributesActions.assertSubmitDisabled();
});

Given("Admin has created a custom attribute", async ({ customAttributesActions }) => {
  const name = await customAttributesActions.getOrCreateAttributeName();
  await customAttributesActions.createDropdownAttribute(name, "Good");
});

When("Admin opens the new custom attribute from the list", async ({ customAttributesActions }) => {
  const name = await customAttributesActions.getOrCreateAttributeName();
  await customAttributesActions.clickAttributeId(name);
});

Then(
  "Verify the custom attribute detail page shows the real Name, Type, and Status",
  async ({ customAttributesActions }) => {
    const name = await customAttributesActions.getOrCreateAttributeName();
    await customAttributesActions.assertDetailHeadingVisible();
    await customAttributesActions.assertDetailName(name);
    // Confirmed live: the detail page renders this as "DropDown" (capital D), unlike the create form's "Dropdown" label.
    await customAttributesActions.assertDetailType("DropDown");
    await customAttributesActions.assertDetailStatus("Activated");
  },
);

When("Admin opens the new custom attribute's row menu", async ({ customAttributesActions }) => {
  const name = await customAttributesActions.getOrCreateAttributeName();
  await customAttributesActions.openRowMenu(name);
});

When("Admin clicks Edit from the row menu", async ({ customAttributesActions }) => {
  const name = await customAttributesActions.getOrCreateAttributeName();
  await customAttributesActions.clickRowMenuItem(name, "Edit");
});

When("Admin updates the Attribute Name", async ({ customAttributesActions }) => {
  const updatedName = await customAttributesActions.getOrCreateUpdatedAttributeName();
  await customAttributesActions.updateName(updatedName);
});

Then("Verify the updated custom attribute appears in the list", async ({ customAttributesActions }) => {
  const updatedName = await customAttributesActions.getOrCreateUpdatedAttributeName();
  await customAttributesActions.assertAttributeVisible(updatedName);
});

When("Admin deactivates the custom attribute", async ({ customAttributesActions }) => {
  await customAttributesActions.toggleStatus("Deactivate");
});

When("Admin activates the custom attribute", async ({ customAttributesActions }) => {
  await customAttributesActions.toggleStatus("Activate");
});

Then("Verify the custom attribute's detail status is {string}", async ({ customAttributesActions }, status: string) => {
  await customAttributesActions.assertDetailStatus(status);
});

When("Admin cancels the custom attribute form", async ({ customAttributesActions }) => {
  await customAttributesActions.clickFormCancel();
});

Then("Verify the new custom attribute does not appear in the list", async ({ customAttributesActions }) => {
  const name = await customAttributesActions.getOrCreateAttributeName();
  await customAttributesActions.assertAttributeNotVisible(name);
});

When("Admin enters a too-long Attribute Name", async ({ customAttributesActions }) => {
  const { longAttributeName } = loadCustomAttributesProps();
  await customAttributesActions.enterTooLongName(longAttributeName);
});

Then("Verify the Attribute Name length error is shown", async ({ customAttributesActions }) => {
  await customAttributesActions.assertNameAlertVisible("Attribute Name must not exceed 25 characters.");
});

Then("Verify the Custom Attributes default page size is 10", async ({ customAttributesActions }) => {
  await customAttributesActions.assertDefaultPageSizeIsTen();
});

When("Admin attempts to open Custom Attributes directly", async ({ customAttributesActions }) => {
  await customAttributesActions.openCustomAttributesDirectly();
});

When("Admin fills the Attribute Name with a SQL-injection-style string", async ({ customAttributesActions }) => {
  const { sqlInjectionString } = loadCustomAttributesProps();
  await customAttributesActions.fillName(sqlInjectionString);
});

Then("Verify the custom attributes page did not crash", async ({ customAttributesActions }) => {
  await customAttributesActions.assertPageDidNotCrash();
});

When("Admin fills Value 1 with an XSS-style string", async ({ customAttributesActions }) => {
  const { xssString } = loadCustomAttributesProps();
  await customAttributesActions.fillValue(1, xssString);
});

When("Admin fills Value 1 with varied content", async ({ customAttributesActions }) => {
  const { variedContentValue } = loadCustomAttributesProps();
  await customAttributesActions.fillValue(1, variedContentValue);
});

When("Admin creates a second, different custom attribute", async ({ customAttributesActions }) => {
  const name = await customAttributesActions.getOrCreateSecondAttributeName();
  await customAttributesActions.createDropdownAttribute(name, "Excellent");
});

Then("Verify the first custom attribute is still unchanged in the list", async ({ customAttributesActions }) => {
  const name = await customAttributesActions.getOrCreateAttributeName();
  await customAttributesActions.assertAttributeVisible(name);
  await customAttributesActions.assertRowStatusIs(name, "Active");
});

Then("Verify the Value 1 field is no longer shown", async ({ customAttributesActions }) => {
  await customAttributesActions.assertValueInputHidden(1);
});

When("Admin attempts to create a duplicate of the custom attribute", async ({ customAttributesActions }) => {
  const name = await customAttributesActions.getOrCreateAttributeName();
  await customAttributesActions.openCustomAttributesDirectly();
  await customAttributesActions.createDropdownAttribute(name, "Good");
});

Then("Verify a duplicate attribute name error is shown", async ({ customAttributesActions }) => {
  await customAttributesActions.assertDuplicateNameErrorShown();
});
