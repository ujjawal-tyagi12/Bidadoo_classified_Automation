@equipment-search @BIDC-469 @smoke
Feature: Homepage - Search for Equipment

  As a buyer, I can search for equipment from the homepage by keyword and/or
  location, as an anonymous, public visitor (no login required). Selectors and
  behavior confirmed live against the QA app — see
  docs/requirements/equipment-search-automation-requirements.md.

  @smoke @TC1
  Scenario: A real keyword combined with a real location returns results
    Given Admin is on the homepage
    When Admin searches for a real equipment term and a real location
    Then Verify the search results page is shown

  @smoke @TC2
  Scenario: A real keyword with no location returns results
    Given Admin is on the homepage
    When Admin searches for a real equipment term
    Then Verify the search results page is shown

  @smoke @TC3
  Scenario: A real location with no keyword returns results
    Given Admin is on the homepage
    When Admin searches using only a real location
    Then Verify the search results page is shown

  @TC4
  Scenario: A partial real keyword still returns results
    Given Admin is on the homepage
    When Admin searches using a partial real equipment term
    Then Verify the search results page is shown

  @TC5
  Scenario: A symbols-only keyword does not trigger a search
    Given Admin is on the homepage
    When Admin searches using symbols only
    Then Verify Admin remains on the homepage with no error shown

  @TC6
  Scenario: An empty keyword and no location returns the unfiltered results baseline
    Given Admin is on the homepage
    When Admin searches with an empty keyword and no location
    Then Verify the search results page is shown

  @TC7
  Scenario: A keyword with no matching listings shows the empty state message
    Given Admin is on the homepage
    When Admin searches for a gibberish term with no results
    Then Verify the empty state message is shown

  @TC8
  Scenario: A Location dropdown load failure renders no options and no error
    Given Admin is on the homepage
    When Admin attempts to open the location dropdown while the location service is failing
    Then Verify the location dropdown shows no options and no error

  @TC9
  Scenario: A search-service timeout leaves Admin on the homepage with no error
    Given Admin is on the homepage
    When Admin searches while the search service times out
    Then Verify Admin remains on the homepage with no error shown

  @TC11
  Scenario: There is no maximum length restriction on the search keyword
    Given Admin is on the homepage
    When Admin searches using a very long keyword
    Then Verify the full keyword was submitted without truncation

  @TC12
  Scenario: A real hyphenated keyword returns results
    Given Admin is on the homepage
    When Admin searches using a real hyphenated equipment term
    Then Verify the search results page is shown

  @TC14
  Scenario: A real mixed alphanumeric keyword returns results
    Given Admin is on the homepage
    When Admin searches using a real mixed alphanumeric equipment term
    Then Verify the search results page is shown

  @TC13
  Scenario: A real numeric keyword returns results
    Given Admin is on the homepage
    When Admin searches using a real numeric equipment term
    Then Verify the search results page is shown

  @TC15 @TC23
  Scenario: Selecting a location filter on the results page updates the results
    Given Admin is on the search results page
    When Admin selects a real location filter
    And Admin applies the filters
    Then Verify the newly selected location filter tag is shown

  @TC17 @TC24
  Scenario: The search suggestions panel is static, not keyword-filtered
    Given Admin is on the homepage
    Then Verify the search suggestions panel is static regardless of input

  @TC20
  Scenario: The location dropdown lazy-loads its full list of states and provinces
    Given Admin is on the homepage
    Then Verify the location dropdown loads its full list of states and provinces

  @TC26
  Scenario: Browser Back to the homepage does not restore the previous search keyword
    Given Admin is on the homepage
    When Admin searches for a real equipment term
    And Admin navigates back to the previous page
    Then Verify the homepage search input is empty

  @TC10
  Scenario: Typing alone never triggers a search, regardless of length
    Given Admin is on the homepage
    When Admin types a keyword without clicking Search
    Then Verify Admin remains on the homepage with no error shown

  @TC16 @TC22
  Scenario: Clearing all filters resets an active homepage-originated search
    Given Admin is on the homepage
    When Admin searches for a real equipment term
    Then Verify the search results page is shown
    When Admin clears all filters via the tag bar
    Then Verify no active filters remain

  @TC18
  Scenario: A location starting with "New" is a real, selectable suggestion
    Given Admin is on the homepage
    When Admin selects a real location starting with "New"
    Then Verify the selected location is displayed in the Location field

  @TC19
  Scenario: An invalid location id in the URL is handled gracefully
    Given Admin is on the homepage
    When Admin navigates directly to search results with an invalid location id
    Then Verify the empty state message is shown

  @TC21 @TC27
  Scenario: Search context persists across browser back/forward between results and a detail page
    Given Admin is on the homepage
    When Admin searches for a real equipment term
    And Admin opens the first result's detail page
    When Admin navigates back to the previous page
    Then Verify the search results page is shown
    When Admin navigates forward to the detail page
    Then Verify the equipment detail breadcrumb is shown

  @TC25
  Scenario: Search context persists across a refresh of the results page
    Given Admin is on the homepage
    When Admin searches for a real equipment term
    Then Verify the search results page is shown
    When Admin refreshes the results page
    Then Verify the search results page is shown

  @TC29 @TC30 @TC31 @TC36
  Scenario: Search results remain visible across desktop, tablet, and mobile viewport widths
    Given Admin is on the homepage
    When Admin searches for a real equipment term
    Then Verify the search results page is shown
    Then Verify the search results remain visible across desktop, tablet, and mobile widths
