@equipment-favorite @BIDC-630 @msite
Feature: Equipment Favorite Icon - Mobile Responsiveness

  The favorite icon on the `/search` result cards must render and remain
  clickable on a real mobile device profile. Verified live at 390×844 — see
  docs/requirements/equipment-favorite-automation-requirements.md §1.

  @TC11
  Scenario: A logged-in user can mark equipment as favorite on a mobile viewport
    Given Admin logs in with valid credentials
    And Admin is on the search results page
    And Admin ensures the first result is not marked as favorite
    When Admin clicks the favorite icon on the first result
    Then Verify the favorite icon on the first result shows as favorited
