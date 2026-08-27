import { createBdd } from "playwright-bdd";
import { test } from "../support/test.js";
import { resolveTestAssetPath } from "@core/utils/file-path.util.js";
import type { WizardStepName } from "../actions/CreateEquipmentShellActions.js";

const { Given, When, Then } = createBdd(test);

Given("Admin logs in with valid credentials", async ({ loginActions }) => {
  await loginActions.loginAsAdmin();
});

Given("Admin opens the Listings tab", async ({ sellerDashboardActions }) => {
  await sellerDashboardActions.openListingsTab();
});

When("Admin starts a new listing", async ({ sellerDashboardActions }) => {
  await sellerDashboardActions.startNewListing();
});

Given("Admin is on the Create New Listing page", async ({ createEquipmentShellActions }) => {
  await createEquipmentShellActions.openDirectly();
});

When("Admin clicks the back control", async ({ createEquipmentShellActions }) => {
  await createEquipmentShellActions.clickBack();
});

Then("Verify Admin is redirected to the Seller Dashboard", async ({ createEquipmentShellActions }) => {
  await createEquipmentShellActions.assertRedirectedToDashboard();
});

Then("Verify the breadcrumb shows Create New Listing", async ({ createEquipmentShellActions }) => {
  await createEquipmentShellActions.assertBreadcrumb();
});

Then("Verify the stepper shows {string} as the active step", async ({ createEquipmentShellActions }, stepName: string) => {
  await createEquipmentShellActions.assertActiveStep(stepName as WizardStepName);
});

When("Admin fills in valid Asset Information", async ({ assetInformationActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await assetInformationActions.fillAssetInformation(validAssetInformation);
});

When("Admin clicks Next", async ({ createEquipmentShellActions }) => {
  await createEquipmentShellActions.clickNext();
});

Then("Verify the Next button is disabled", async ({ createEquipmentShellActions }) => {
  await createEquipmentShellActions.assertNextDisabled();
});

When("Admin fills in valid Location details", async ({ locationActions }) => {
  const { validLocation } = await locationActions.getEquipmentProps();
  await locationActions.fillLocation(validLocation);
});

When("Admin opens the previously saved locations picker", async ({ locationActions }) => {
  await locationActions.openPreviousLocations();
});

Then("Verify at least one previously saved location is available", async ({ locationActions }) => {
  await locationActions.assertPreviousLocationsListVisible();
});

When("Admin fills in valid Pricing and Contact details", async ({ pricingContactActions }) => {
  const { validPricingContact } = await pricingContactActions.getEquipmentProps();
  await pricingContactActions.fillPricingContact(validPricingContact);
});

When("Admin chooses to use company contact details", async ({ pricingContactActions }) => {
  await pricingContactActions.useCompanyContactDetails();
});

Then("Verify the Contact Name field is disabled", async ({ pricingContactActions }) => {
  await pricingContactActions.assertContactNameDisabled();
});

When("Admin fills in valid Description and Details", async ({ descriptionDetailsActions }) => {
  const { validDescriptionDetails } = await descriptionDetailsActions.getEquipmentProps();
  await descriptionDetailsActions.fillDescriptionDetails(validDescriptionDetails);
});

When("Admin fills in Description and Details with an empty Description", async ({ descriptionDetailsActions }) => {
  const { validDescriptionDetails } = await descriptionDetailsActions.getEquipmentProps();
  await descriptionDetailsActions.fillDescriptionDetails({ ...validDescriptionDetails, description: "" });
});

When(
  "Admin fills in Description and Details with a description under the minimum length",
  async ({ descriptionDetailsActions }) => {
    const { validDescriptionDetails } = await descriptionDetailsActions.getEquipmentProps();
    await descriptionDetailsActions.fillDescriptionDetails({
      ...validDescriptionDetails,
      description: "Valid description.",
    });
  },
);

Then("Verify the description minimum length error is shown", async ({ descriptionDetailsActions }) => {
  await descriptionDetailsActions.assertDescriptionMinLengthErrorVisible();
});

When("Admin types a description and applies bold formatting", async ({ descriptionDetailsActions }) => {
  await descriptionDetailsActions.applyBoldToDescription("This is a bold description.");
});

Then("Verify the description text is bold formatted", async ({ descriptionDetailsActions }) => {
  await descriptionDetailsActions.assertDescriptionHasBoldFormatting();
});

When("Admin uploads a valid equipment image", async ({ mediaUploadActions }) => {
  await mediaUploadActions.uploadImages([resolveTestAssetPath("equipment-photo.png")]);
});

When("Admin uploads a file with an invalid format", async ({ mediaUploadActions }) => {
  await mediaUploadActions.uploadImages([resolveTestAssetPath("invalid-format.txt")]);
});

Then("Verify the upload was rejected as an unsupported format", async ({ mediaUploadActions }) => {
  await mediaUploadActions.assertUploadRejected();
});

When("Admin adds a valid video link", async ({ mediaUploadActions }) => {
  const { mediaUpload } = await mediaUploadActions.getEquipmentProps();
  await mediaUploadActions.addVideoLink(mediaUpload.validVideoLink);
});

When("Admin adds a video link from an unsupported domain", async ({ mediaUploadActions }) => {
  const { mediaUpload } = await mediaUploadActions.getEquipmentProps();
  await mediaUploadActions.addVideoLink(mediaUpload.unsupportedDomainVideoLink);
});

When("Admin removes the first video link", async ({ mediaUploadActions }) => {
  await mediaUploadActions.removeVideoLink(0);
});

Then("Verify the Submit button is disabled", async ({ createEquipmentShellActions }) => {
  await createEquipmentShellActions.assertSubmitDisabled();
});

Then("Verify the Submit button is enabled", async ({ createEquipmentShellActions }) => {
  await createEquipmentShellActions.assertSubmitEnabled();
});

When("Admin clicks Submit", async ({ createEquipmentShellActions }) => {
  await createEquipmentShellActions.clickSubmit();
});

Then("Verify the submit confirmation dialog is shown", async ({ submissionActions }) => {
  await submissionActions.assertConfirmationDialogVisible();
});

When("Admin cancels the submission", async ({ submissionActions }) => {
  await submissionActions.cancelSubmission();
});

Then("Verify the submit confirmation dialog is closed", async ({ submissionActions }) => {
  await submissionActions.assertConfirmationDialogClosed();
});

Then("Verify the uploaded image is still present", async ({ mediaUploadActions }) => {
  await mediaUploadActions.assertImageStillUploaded();
});

When("Admin saves as draft", async ({ createEquipmentShellActions }) => {
  await createEquipmentShellActions.saveAsDraft();
});

When("Admin confirms the submission", async ({ submissionActions }) => {
  await submissionActions.confirmSubmission();
});

Then("Verify the new listing appears in the Listings table", async ({ sellerDashboardActions }) => {
  await sellerDashboardActions.assertGeneratedListingVisible();
});

Then("Verify the seeded listing appears in the Listings table", async ({ sellerDashboardActions, state }) => {
  const title = state.getSharedData<string>("seedListingTitle");
  if (!title) {
    throw new Error("Missing shared scenario data for key: seedListingTitle");
  }
  await sellerDashboardActions.searchListings(title);
  await sellerDashboardActions.assertListingVisible(title);
});

Then("Verify the Next button is enabled", async ({ createEquipmentShellActions }) => {
  await createEquipmentShellActions.assertNextEnabled();
});

When("Admin fills in Asset Information with an empty Listing Title", async ({ assetInformationActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await assetInformationActions.fillAssetInformation({ ...validAssetInformation, title: "" });
});

When("Admin fills in Asset Information with an empty Make", async ({ assetInformationActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await assetInformationActions.fillAssetInformation({ ...validAssetInformation, make: "" });
});

When("Admin fills in Asset Information with an empty Model", async ({ assetInformationActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await assetInformationActions.fillAssetInformation({ ...validAssetInformation, model: "" });
});

When("Admin fills in Asset Information with a non-numeric Model Year", async ({ assetInformationActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await assetInformationActions.fillAssetInformation({ ...validAssetInformation, year: "abcd" });
});

When("Admin fills in Asset Information with a boundary Model Year of 1900", async ({ assetInformationActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await assetInformationActions.fillAssetInformation({ ...validAssetInformation, year: "1900" });
});

When("Admin fills in valid Asset Information with a unique title", async ({ assetInformationActions, state }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  const title = `${validAssetInformation.title} ${Date.now()}`;
  state.setSharedData("seedListingTitle", title);
  await assetInformationActions.fillAssetInformation({ ...validAssetInformation, title });
});

When("Admin uploads {int} valid equipment images", async ({ mediaUploadActions }, count: number) => {
  await mediaUploadActions.uploadImages(Array(count).fill(resolveTestAssetPath("equipment-photo.png")));
});

When(
  "Admin fills in valid Asset Information with a unique Reference ID",
  async ({ assetInformationActions, state }) => {
    const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
    const referenceId = `REF${Date.now()}`;
    state.setSharedData("referenceId", referenceId);
    await assetInformationActions.fillAssetInformation({ ...validAssetInformation, referenceId });
  },
);

When(
  "Admin fills in valid Asset Information with the same Reference ID again",
  async ({ assetInformationActions, state }) => {
    const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
    const referenceId = state.getSharedData<string>("referenceId");
    await assetInformationActions.fillAssetInformation({ ...validAssetInformation, referenceId });
  },
);

Then("Verify the duplicate Reference ID error is shown", async ({ assetInformationActions }) => {
  await assetInformationActions.assertDuplicateReferenceIdError();
});

When("Admin fills in Pricing and Contact details with no Currency selected", async ({ pricingContactActions }) => {
  const { validPricingContact } = await pricingContactActions.getEquipmentProps();
  await pricingContactActions.fillPricingContact({ ...validPricingContact, currency: "" });
});

When(
  "Admin fills in Pricing and Contact details with an invalid Contact Email",
  async ({ pricingContactActions }) => {
    const { validPricingContact } = await pricingContactActions.getEquipmentProps();
    await pricingContactActions.fillPricingContact({ ...validPricingContact, contactEmail: "not-an-email" });
  },
);

When(
  "Admin fills in Pricing and Contact details with a short Contact Phone",
  async ({ pricingContactActions }) => {
    const { validPricingContact } = await pricingContactActions.getEquipmentProps();
    await pricingContactActions.fillPricingContact({ ...validPricingContact, contactPhone: "12345" });
  },
);

Then("Verify the Category button is disabled", async ({ assetInformationActions }) => {
  await assetInformationActions.assertCategoryButtonDisabled();
});

Then("Verify the Category button is enabled", async ({ assetInformationActions }) => {
  await assetInformationActions.assertCategoryButtonEnabled();
});

When("Admin fills in Asset Information without selecting a Category", async ({ assetInformationActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await assetInformationActions.fillAssetInformation({ ...validAssetInformation, categoryPath: [] });
});

When("Admin fills in Asset Information without selecting a Usage Type", async ({ assetInformationActions }) => {
  const { validAssetInformation } = await assetInformationActions.getEquipmentProps();
  await assetInformationActions.fillAssetInformation({ ...validAssetInformation, usageType: undefined });
});

When("Admin fills in the maximum number of video links", async ({ mediaUploadActions }) => {
  const { mediaUpload } = await mediaUploadActions.getEquipmentProps();
  await mediaUploadActions.fillMaximumVideoLinks(mediaUpload.videoLinkBaseUrl);
});

Then("Verify the Add Link button is disabled", async ({ mediaUploadActions }) => {
  await mediaUploadActions.assertAddLinkButtonDisabled();
});

Then("Verify the Listings tab shows New Listing and Bulk Upload actions", async ({ sellerDashboardActions }) => {
  await sellerDashboardActions.assertNewListingAndBulkUploadActionsVisible();
});

When("Admin starts a bulk upload", async ({ sellerDashboardActions }) => {
  await sellerDashboardActions.startBulkUpload();
});

Then("Verify the Bulk Upload menu shows its CSV actions", async ({ sellerDashboardActions }) => {
  await sellerDashboardActions.assertBulkUploadMenuOptionsVisible();
});

When("Admin adds a malformed video link", async ({ mediaUploadActions }) => {
  const { mediaUpload } = await mediaUploadActions.getEquipmentProps();
  await mediaUploadActions.addVideoLink(mediaUpload.malformedVideoLink);
});

When("Admin uploads more than the maximum allowed images", async ({ mediaUploadActions }) => {
  await mediaUploadActions.uploadOverMaximumImages(resolveTestAssetPath("equipment-photo.png"));
});

Then("Verify the excess images were rejected", async ({ mediaUploadActions }) => {
  await mediaUploadActions.assertMaxImagesRejected();
});
