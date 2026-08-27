@contact-seller @BIDC-629 @msite
Feature: Contact Seller Form - Mobile Responsiveness

  The Contact Seller modal must render correctly on a real mobile device
  profile. Verified live on the confirmed-stable, image-based fixture
  listing ("Tractor") — see
  docs/requirements/contact-seller-automation-requirements.md §2.

  @TC19
  Scenario: Contact Seller form renders correctly on a mobile viewport
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    And Admin opens the Contact Seller form
    Then Verify the Contact Seller form is visible
