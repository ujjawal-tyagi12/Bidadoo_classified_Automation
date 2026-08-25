@create-equipment @BIDC-280
Feature: Create Equipment - Single Listing

  As a seller, I can create a new equipment listing through the 5-step
  Create New Listing wizard from my Seller Dashboard.

  Background:
    Given Admin logs in with valid credentials

  @smoke @TC1 @TC4 @TC5
  Scenario: Navigate to Create New Listing from the Seller Dashboard
    Given Admin opens the Listings tab
    When Admin starts a new listing
    Then Verify the breadcrumb shows Create New Listing
    And Verify the stepper shows "Asset Information" as the active step
    And Verify the Next button is disabled

  @smoke @TC2
  Scenario: Back button returns to the Seller Dashboard
    Given Admin is on the Create New Listing page
    When Admin clicks the back control
    Then Verify Admin is redirected to the Seller Dashboard

  @smoke @TC6
  Scenario: Enter valid Asset Information and advance to Location
    Given Admin is on the Create New Listing page
    When Admin fills in valid Asset Information
    And Admin clicks Next
    Then Verify the stepper shows "Location" as the active step

  @smoke @TC9
  Scenario: Enter valid Location details and advance to Pricing & Contact Details
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    When Admin fills in valid Location details
    And Admin clicks Next
    Then Verify the stepper shows "Pricing & Contact Details" as the active step

  @TC34
  Scenario: Previously saved locations are available to select from
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    When Admin opens the previously saved locations picker
    Then Verify at least one previously saved location is available

  @smoke @TC10
  Scenario: Enter valid Pricing and Contact details and advance to Description & Details
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    When Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    Then Verify the stepper shows "Description & Details" as the active step

  @TC-use-company-contact
  Scenario: Use Company Contact Details auto-fills and locks the Contact Name field
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    When Admin chooses to use company contact details
    Then Verify the Contact Name field is disabled

  @smoke @TC11
  Scenario: Enter valid Description and Details and advance to Media Upload
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    When Admin fills in valid Description and Details
    And Admin clicks Next
    Then Verify the stepper shows "Media Upload" as the active step

  @TC36
  Scenario: Description editor supports rich text formatting
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    When Admin types a description and applies bold formatting
    Then Verify the description text is bold formatted

  @smoke @TC12
  Scenario: Upload a valid image and video link enables Submit
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    And Admin fills in valid Description and Details
    And Admin clicks Next
    When Admin uploads a valid equipment image
    And Admin adds a valid video link
    Then Verify the Submit button is enabled

  @TC24
  Scenario: Submit is disabled until an image is uploaded
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    And Admin fills in valid Description and Details
    And Admin clicks Next
    Then Verify the Submit button is disabled

  @TC53
  Scenario: Uploading an unsupported file format is rejected
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    And Admin fills in valid Description and Details
    And Admin clicks Next
    When Admin uploads a file with an invalid format
    Then Verify the upload was rejected as an unsupported format
    And Verify the Submit button is disabled

  @TC56
  Scenario: A video link from an unsupported domain blocks Submit
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    And Admin fills in valid Description and Details
    And Admin clicks Next
    And Admin uploads a valid equipment image
    When Admin adds a video link from an unsupported domain
    Then Verify the Submit button is disabled

  @TC39
  Scenario: Deleting an invalid video link unblocks Submit
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    And Admin fills in valid Description and Details
    And Admin clicks Next
    And Admin uploads a valid equipment image
    And Admin adds a video link from an unsupported domain
    And Verify the Submit button is disabled
    When Admin removes the first video link
    Then Verify the Submit button is enabled

  @smoke @TC40
  Scenario: Submit shows a confirmation dialog before publishing
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    And Admin fills in valid Description and Details
    And Admin clicks Next
    And Admin uploads a valid equipment image
    When Admin clicks Submit
    Then Verify the submit confirmation dialog is shown

  @smoke @TC41
  Scenario: Cancelling the submit confirmation preserves the form
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    And Admin fills in valid Description and Details
    And Admin clicks Next
    And Admin uploads a valid equipment image
    And Admin clicks Submit
    When Admin cancels the submission
    Then Verify the submit confirmation dialog is closed
    And Verify the uploaded image is still present
    And Verify the Submit button is enabled

  @smoke @TC14
  Scenario: Save as Draft persists the listing
    Given Admin is on the Create New Listing page
    When Admin fills in valid Asset Information
    And Admin saves as draft
    Then Verify the new listing appears in the Listings table

  @smoke @TC15 @TC42
  Scenario: Confirming submission publishes the listing
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    And Admin fills in valid Description and Details
    And Admin clicks Next
    And Admin uploads a valid equipment image
    And Admin clicks Submit
    When Admin confirms the submission
    Then Verify the new listing appears in the Listings table

  @TC17
  Scenario: Listing Title is required
    Given Admin is on the Create New Listing page
    When Admin fills in Asset Information with an empty Listing Title
    Then Verify the Next button is disabled

  @TC19
  Scenario: Make is required
    Given Admin is on the Create New Listing page
    When Admin fills in Asset Information with an empty Make
    Then Verify the Next button is disabled

  @TC20
  Scenario: Model is required
    Given Admin is on the Create New Listing page
    When Admin fills in Asset Information with an empty Model
    Then Verify the Next button is disabled

  @TC32
  Scenario: Model Year rejects non-numeric input
    Given Admin is on the Create New Listing page
    When Admin fills in Asset Information with a non-numeric Model Year
    Then Verify the Next button is disabled

  @TC44
  Scenario: Model Year accepts the boundary value 1900
    Given Admin is on the Create New Listing page
    When Admin fills in Asset Information with a boundary Model Year of 1900
    Then Verify the Next button is enabled

  @smoke @TC7 @TC16
  Scenario: Reference ID must be unique across listings
    Given Admin is on the Create New Listing page
    When Admin fills in valid Asset Information with a unique Reference ID
    And Admin saves as draft
    Then Verify the new listing appears in the Listings table
    When Admin is on the Create New Listing page
    And Admin fills in valid Asset Information with the same Reference ID again
    And Admin saves as draft
    Then Verify the duplicate Reference ID error is shown

  @TC22
  Scenario: Currency is required
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    When Admin fills in Pricing and Contact details with no Currency selected
    Then Verify the Next button is disabled

  @TC25
  Scenario: Contact Email must be a valid format
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    When Admin fills in Pricing and Contact details with an invalid Contact Email
    Then Verify the Next button is disabled

  @TC26
  Scenario: Contact Phone must meet the minimum digit length
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    When Admin fills in Pricing and Contact details with a short Contact Phone
    Then Verify the Next button is disabled

  @TC8 @TC18
  Scenario: Category selection is disabled until Make and Model are filled
    Given Admin is on the Create New Listing page
    Then Verify the Category button is disabled
    When Admin fills in Asset Information without selecting a Category
    Then Verify the Category button is enabled

  @TC45
  Scenario: Usage Type is required
    Given Admin is on the Create New Listing page
    When Admin fills in Asset Information without selecting a Usage Type
    Then Verify the Next button is disabled

  @TC38
  Scenario: Video links are capped at 5
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    And Admin fills in valid Description and Details
    And Admin clicks Next
    When Admin fills in the maximum number of video links
    Then Verify the Add Link button is disabled

  @TC3
  Scenario: Listings tab offers both New Listing and Bulk Upload
    Given Admin opens the Listings tab
    Then Verify the Listings tab shows New Listing and Bulk Upload actions

  @TC29
  Scenario: A malformed video link blocks Submit
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    And Admin fills in valid Description and Details
    And Admin clicks Next
    And Admin uploads a valid equipment image
    When Admin adds a malformed video link
    Then Verify the Submit button is disabled

  @TC28
  Scenario: Image uploads are capped at 50
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    And Admin fills in valid Description and Details
    And Admin clicks Next
    When Admin uploads more than the maximum allowed images
    Then Verify the excess images were rejected

  @TC30
  Scenario: Bulk Upload offers CSV-based actions rather than a form to reset
    Given Admin opens the Listings tab
    When Admin starts a bulk upload
    Then Verify the Bulk Upload menu shows its CSV actions

  @TC23
  Scenario: Description is required
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    When Admin fills in Description and Details with an empty Description
    Then Verify the Next button is disabled

  @TC27
  Scenario: Description enforces a minimum length
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    When Admin fills in Description and Details with a description under the minimum length
    Then Verify the description minimum length error is shown
    And Verify the Next button is disabled
