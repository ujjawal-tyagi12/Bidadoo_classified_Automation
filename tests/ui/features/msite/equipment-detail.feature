@equipment-detail @BIDC-616 @msite
Feature: Equipment Detail Page - Mobile Responsiveness

  The equipment detail page and its image viewer must render without a
  layout crash on a real mobile device profile. Verified live on the
  confirmed-stable, image-based fixture listing ("Tractor") — see
  docs/requirements/equipment-detail-automation-requirements.md §2.

  @TC20
  Scenario: Equipment detail page and image viewer render correctly on a mobile viewport
    Given Admin is on the homepage
    When Admin searches for the equipment detail fixture "Tractor"
    And Admin opens the first result's detail page
    Then Verify the equipment detail sections are visible
    When Admin opens the image viewer
    Then Verify the image viewer is visible
