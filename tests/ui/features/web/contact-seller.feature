@contact-seller @BIDC-629 @smoke
Feature: Contact Seller Form - Field Validation, Filtering, and Edge Cases

  Deep-dive coverage of the Contact Seller enquiry modal (opened from the
  Equipment Detail page), scoped by BIDC-629. The modal's display, the
  Submit button's disabled→enabled gating, invalid-email inline message, and
  keyboard-reachability of the trigger button are already automated under
  BIDC-616 (see equipment-detail.feature TC16/TC18/TC19/TC24) and are not
  re-built here. Every scenario below targets real, live-confirmed behavior
  from docs/requirements/contact-seller-automation-requirements.md §2/§3 —
  most notably that First Name, Last Name, and Phone silently strip
  disallowed characters as the user types rather than rejecting them with a
  post-submit validation error. All scenarios use the confirmed-stable
  "Tractor" fixture listing, same as equipment-detail.feature.

  @smoke @TC5
  Scenario: Cancel closes the Contact Seller form without leaving the detail page
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin opens the Contact Seller form
    When Admin clicks Cancel in the Contact Seller form
    Then Verify the Contact Seller form is hidden
    And Verify the equipment detail sections are visible

  @TC8 @TC10 @TC41 @TC42
  Scenario: Email format validation matches the real inline message for every case
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin opens the Contact Seller form
    Then Verify email format validation matches the real inline message for each case

  @TC9 @TC13 @TC16 @TC32 @TC35
  Scenario: Phone Number field strips non-digit characters as typed
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin opens the Contact Seller form
    Then Verify the Phone Number field only keeps digits as each character is typed

  @TC6 @TC7 @TC14 @TC15 @TC31 @TC36 @TC37 @TC38 @TC39
  Scenario: Name fields strip invalid characters as typed and do not trim spaces
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin opens the Contact Seller form
    Then Verify the First Name field only keeps letters and spaces as each character is typed
    And Verify the Last Name field only keeps letters and spaces as each character is typed

  @TC36
  Scenario: Email field trims leading and trailing spaces
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin opens the Contact Seller form
    Then Verify the Email field trims leading and trailing spaces

  @TC12 @TC13 @TC40
  Scenario: Boundary-length First Name, Phone, and Email values are accepted in full
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin opens the Contact Seller form
    Then Verify boundary-length First Name, Phone, and Email values are accepted in full

  @smoke @TC17
  Scenario: The Message field is pre-filled with a real enquiry referencing the equipment
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin opens the Contact Seller form
    Then Verify the Message field is pre-filled with "Tractor"'s enquiry text

  @smoke @TC43 @TC44
  Scenario: The Message field can be cleared or edited without blocking submission
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin opens the Contact Seller form
    When Admin fills the required Contact Seller fields with valid data
    And Admin clears the Contact Seller Message field
    Then Verify the Contact Seller Submit button is enabled
    When Admin replaces the Contact Seller Message with "Custom enquiry text"
    Then Verify the Contact Seller Submit button is enabled

  @TC18
  Scenario: The Contact Seller form stays open and unaffected by an offline submit attempt
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin opens the Contact Seller form
    And Admin fills the required Contact Seller fields with valid data
    When Admin submits the Contact Seller form while offline
    Then Verify the Contact Seller form is unaffected by the offline submission attempt

  @TC28
  Scenario: Cancelling and reopening the Contact Seller form resets it to defaults
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin opens the Contact Seller form
    And Admin fills the required Contact Seller fields with valid data
    When Admin clicks Cancel in the Contact Seller form
    And Admin opens the Contact Seller form
    Then Verify the Contact Seller form is reset to its default state for "Tractor"

  @TC30
  Scenario: Submit stays disabled when required fields are filled at minimum length
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin opens the Contact Seller form
    When Admin fills the Contact Seller form with minimum-length values
    Then Verify the Contact Seller Submit button is disabled

  @smoke @TC3 @TC26
  Scenario: An anonymous visitor can manually enter contact information and tab through every field
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin activates the Contact Seller button via keyboard
    Then Verify the Contact Seller form is visible
    And Verify keyboard Tab moves focus through all Contact Seller fields in order
    When Admin fills the required Contact Seller fields with valid data
    Then Verify the Contact Seller Submit button is enabled
