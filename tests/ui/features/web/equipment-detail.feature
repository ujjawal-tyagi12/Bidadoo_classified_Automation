@equipment-detail @BIDC-616 @smoke
Feature: Equipment Detail Page - Content, Gallery, Seller Info and Contact Seller Form

  As a buyer, I can view full equipment details, browse the seller's
  information, follow quick links, and contact the seller — all as an
  anonymous, public visitor (no login required). Content assertions target
  the one confirmed-stable, image-based fixture listing ("Tractor") found in
  the current QA data — see
  docs/requirements/equipment-detail-automation-requirements.md §3/§8: most
  other sampled listings are video-based and intermittently fail to render.

  The multi-image gallery scenarios (TC5, TC8, TC10, TC26) are the exception:
  no naturally-occurring QA listing has more than 1 image, so those seed
  their own real, publicly-searchable listing via the already-proven Create
  Equipment wizard (an admin login is required only for that seeding step —
  the actual gallery verification that follows is still the same anonymous,
  public detail-page view as every other scenario here). See
  docs/requirements/equipment-detail-dependencies.md for the investigation
  that unblocked these.

  @smoke @TC2
  Scenario: Breadcrumb navigation is shown on the equipment detail page
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    Then Verify the equipment detail breadcrumb is shown

  @smoke @TC3
  Scenario: All required equipment detail sections are displayed
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    Then Verify the equipment detail sections are visible

  @smoke @TC4
  Scenario: The first uploaded image is displayed as the selected thumbnail
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    Then Verify the first thumbnail is selected

  @TC5
  Scenario: Browsing images with the modal arrows updates the displayed image
    Given Admin logs in with valid credentials
    And Admin is on the Create New Listing page
    When Admin fills in valid Asset Information with a unique title
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    And Admin fills in valid Description and Details
    And Admin clicks Next
    And Admin uploads 3 valid equipment images
    And Admin clicks Submit
    And Admin confirms the submission
    Then Verify the seeded listing appears in the Listings table
    Given Admin is on the homepage
    When Admin searches for the seeded equipment listing
    And Admin opens the seeded equipment listing's detail page
    And Admin opens the image viewer
    When Admin browses to the next image
    Then Verify the active image index is 1
    When Admin browses to the next image
    Then Verify the active image index is 2

  @smoke @TC7
  Scenario: Clicking the main image opens an enlarged preview modal
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin opens the image viewer
    Then Verify the image viewer is visible

  @TC8
  Scenario: Image modal navigation wraps around instead of disabling at the bounds
    Given Admin logs in with valid credentials
    And Admin is on the Create New Listing page
    When Admin fills in valid Asset Information with a unique title
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    And Admin fills in valid Description and Details
    And Admin clicks Next
    And Admin uploads 3 valid equipment images
    And Admin clicks Submit
    And Admin confirms the submission
    Then Verify the seeded listing appears in the Listings table
    Given Admin is on the homepage
    When Admin searches for the seeded equipment listing
    And Admin opens the seeded equipment listing's detail page
    And Admin opens the image viewer
    Then Verify Previous wraps from the first to the last image
    Then Verify Next wraps from the last to the first image

  @smoke @TC9
  Scenario: Closing the image viewer returns to the detail page
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin opens the image viewer
    Then Verify the image viewer is visible
    When Admin closes the image viewer
    Then Verify the image viewer is hidden

  @TC10
  Scenario: The image modal's thumbnail rail reflects the real uploaded image count
    Given Admin logs in with valid credentials
    And Admin is on the Create New Listing page
    When Admin fills in valid Asset Information with a unique title
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    And Admin fills in valid Description and Details
    And Admin clicks Next
    And Admin uploads 3 valid equipment images
    And Admin clicks Submit
    And Admin confirms the submission
    Then Verify the seeded listing appears in the Listings table
    Given Admin is on the homepage
    When Admin searches for the seeded equipment listing
    And Admin opens the seeded equipment listing's detail page
    And Admin opens the image viewer
    Then Verify the image count is 3

  @smoke @TC11
  Scenario: Seller information is displayed for an anonymous visitor
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    Then Verify the seller information is visible

  @smoke @TC12
  Scenario: Quick links open their destination in a new tab
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    Then Verify the quick links open in a new tab

  @smoke @TC13
  Scenario: The Equipment Details section displays a description
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    Then Verify the Equipment Details section is visible

  @smoke @TC14
  Scenario: The Features and Specifications section is displayed
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    Then Verify the Features section is visible

  @smoke @TC15
  Scenario: The Add-On Services section displays CTA buttons
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    Then Verify the Add-On Services CTAs are visible

  @smoke @TC16
  Scenario: The Contact Seller button opens the enquiry form
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin opens the Contact Seller form
    Then Verify the Contact Seller form is visible

  @smoke @TC18
  Scenario: The Contact Seller Submit button stays disabled until required fields are valid
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin opens the Contact Seller form
    Then Verify the Contact Seller Submit button is disabled
    When Admin fills the required Contact Seller fields with valid data
    Then Verify the Contact Seller Submit button is enabled

  @smoke @TC19
  Scenario: An invalid email shows a real inline validation message
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin opens the Contact Seller form
    When Admin enters an invalid email in the Contact Seller form
    Then Verify the invalid email message is shown

  @TC24
  Scenario: The Contact Seller button is reachable and activatable by keyboard
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin activates the Contact Seller button via keyboard
    Then Verify the Contact Seller form is visible

  @TC25
  Scenario: The Equipment Details and Features section headings share consistent styling
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    Then Verify the section headings have consistent styling

  @TC28
  Scenario: Seller contact details are hidden by default for an anonymous visitor
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    Then Verify the seller's contact details are hidden for an anonymous visitor

  @TC26
  Scenario: A listing at the platform's real maximum image count renders without a crash
    Given Admin logs in with valid credentials
    And Admin is on the Create New Listing page
    When Admin fills in valid Asset Information with a unique title
    And Admin clicks Next
    And Admin fills in valid Location details
    And Admin clicks Next
    And Admin fills in valid Pricing and Contact details
    And Admin clicks Next
    And Admin fills in valid Description and Details
    And Admin clicks Next
    And Admin uploads 50 valid equipment images
    And Admin clicks Submit
    And Admin confirms the submission
    Then Verify the seeded listing appears in the Listings table
    Given Admin is on the homepage
    When Admin searches for the seeded equipment listing
    And Admin opens the seeded equipment listing's detail page
    And Admin opens the image viewer
    Then Verify the image count is 50
