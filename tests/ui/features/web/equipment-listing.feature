@equipment-listing @BIDC-473 @smoke
Feature: Equipment Listing - Search, Filter, Sort and Pagination

  As a buyer, I can search and browse equipment listings from the homepage,
  filter and sort the results, and reach an individual equipment's detail
  page — all as an anonymous, public visitor (no login required).

  @smoke @TC1
  Scenario: Navigate to Equipment Detail Page via all real entry points
    Given Admin is on the homepage
    When Admin searches for a real equipment term
    Then Verify the search results page is shown
    When Admin is on the homepage
    And Admin opens a featured Shop by Category card
    Then Verify the search results page is shown
    When Admin opens the first result's detail page
    Then Verify the equipment detail breadcrumb is shown

  @smoke @TC2
  Scenario: The filter panel renders as an always-visible sidebar on desktop
    Given Admin is on the search results page
    Then Verify the filters sidebar is visible

  @smoke @TC3
  Scenario: Filter categories are collapsed by default and expand on click
    Given Admin is on the search results page
    Then Verify the "Category" filter section is collapsed
    When Admin expands the "Category" filter section
    Then Verify the "Category" filter section is expanded

  @smoke @TC4
  Scenario: Clearing all filters removes every active filter and resets the results
    Given Admin is on the search results page
    When Admin selects a real category leaf filter
    And Admin applies the filters
    Then Verify at least one active filter remains
    When Admin clears all filters from the sidebar
    Then Verify no active filters remain

  @smoke @TC5
  Scenario: Selecting and applying a real category filter updates the search results
    Given Admin is on the search results page
    When Admin selects a real category leaf filter
    And Admin applies the filters
    Then Verify the selected category leaf filter tag is shown

  @smoke @TC6
  Scenario: Active filter tags render one-to-one for a leaf pick and collapse into an overflow pill for a parent pick
    Given Admin is on the search results page
    When Admin selects a real category leaf filter
    And Admin applies the filters
    Then Verify the selected category leaf filter tag is shown
    When Admin clears all filters from the sidebar
    And Admin selects a real top-level category
    And Admin applies the filters
    Then Verify the overflow filter tag pill shows a real overflow count

  @smoke @TC7
  Scenario: Removing an individual filter tag updates the search results
    Given Admin is on the search results page
    When Admin selects a real category leaf filter
    And Admin applies the filters
    Then Verify the selected category leaf filter tag is shown
    When Admin removes the selected category leaf filter tag
    Then Verify the selected category leaf filter tag is no longer shown

  @smoke @TC8
  Scenario: Applying a filter updates the pagination to match the narrower result set
    Given Admin is on the search results page
    When Admin records the baseline total pages
    And Admin selects a real model filter
    And Admin applies the filters
    Then Verify the total pages decreased from the baseline

  @smoke @TC9
  Scenario: Searching from the homepage navigates to matching search results
    Given Admin is on the homepage
    When Admin searches for a real equipment term
    Then Verify the search results page is shown

  @smoke @TC10
  Scenario: Changing the sort option reorders the search results
    Given Admin is on the search results page
    Then Verify all real sort options are available
    When Admin records the first result title
    And Admin sorts results by "Oldest Model"
    Then Verify the first result title changed

  @smoke @TC11
  Scenario: Selecting multiple category leaves applies all selections together
    Given Admin is on the search results page
    When Admin selects two real category leaf filters
    And Admin applies the filters
    Then Verify both selected category leaf filter tags are shown

  @smoke @TC12
  Scenario: The Price Range slider prevents its minimum thumb from reaching its maximum
    Given Admin is on the search results page
    Then Verify the Price Range slider's minimum cannot reach its maximum

  @smoke @TC14
  Scenario: A search with no matches shows the empty state message
    Given Admin is on the homepage
    When Admin searches for a gibberish term with no results
    Then Verify the empty state message is shown

  @regression @TC15
  Scenario: A backend search failure falls back to the generic empty state
    Given Admin opens the search results page with the search API mocked to fail
    Then Verify the empty state message is shown

  @regression @TC16
  Scenario: The filter panel layout adapts correctly across desktop, tablet, and mobile viewports
    Given Admin is on the search results page
    Then Verify the filters sidebar is visible
    And Verify the mobile Filters trigger button is hidden
    When Admin resizes the viewport to tablet width
    Then Verify the mobile Filters trigger button is visible
    And Verify the filters sidebar is hidden
    When Admin resizes the viewport to mobile width
    Then Verify the mobile Filters trigger button is visible
    And Verify the filters sidebar is hidden

  @regression @TC20
  Scenario: Losing network connectivity during a filter apply breaks the page
    Given Admin is on the search results page
    When Admin selects a real category leaf filter
    And Admin loses network connectivity and applies the filters
    Then Verify the page went blank due to the lost connection

  @regression @TC21
  Scenario: Applying a large number of cascaded category filters does not break the results page
    Given Admin is on the search results page
    When Admin selects a real top-level category
    And Admin applies the filters
    Then Verify the results page still renders correctly after the filter action

  @regression @TC22
  Scenario: The Price Range slider's maximum thumb can reach its own dynamic maximum
    Given Admin is on the search results page
    When Admin drags the price max thumb to its own maximum
    And Admin applies the filters
    Then Verify the results page still renders correctly after the filter action

  @regression @TC37
  Scenario: The Price Range slider's minimum thumb can reach its own dynamic minimum
    Given Admin is on the search results page
    When Admin drags the price min thumb to its own minimum
    And Admin applies the filters
    Then Verify the results page still renders correctly after the filter action

  @regression @TC30
  Scenario: An invalid category id in the URL falls back to the generic empty state
    Given Admin opens the search results page with an invalid category id
    Then Verify the empty state message is shown

  @regression @TC31
  Scenario: A symbol-only search query does not navigate away from the homepage
    Given Admin is on the homepage
    When Admin attempts a search with symbols only
    Then Verify Admin is still on the homepage

  @regression @TC36
  Scenario: The unfiltered baseline holds a large number of listings and pages
    Given Admin is on the search results page
    Then Verify the unfiltered baseline has a large number of results and pages

  @low-priority @TC17
  Scenario: Keyboard Tab navigation moves focus through real elements with a visible focus state
    Given Admin is on the homepage
    Then Verify keyboard Tab navigation shows a visible focus state

  @low-priority @TC18
  Scenario: Result cards render View Details buttons with consistent styling
    Given Admin is on the search results page
    Then Verify the View Details buttons are styled consistently

  @low-priority @TC26
  Scenario: A real touch tap opens the mobile filter overlay
    Given Admin is on the search results page
    Then Verify a real touch tap opens the mobile filter overlay

  @low-priority @TC33
  Scenario: A timed-out search request falls back to the generic empty state
    Given Admin opens the search results page with the search API mocked to time out
    Then Verify the empty state message is shown

  @low-priority @TC40
  Scenario: Rotating the viewport from portrait to landscape keeps the results page usable
    Given Admin is on the search results page
    When Admin resizes the viewport to mobile width
    And Admin rotates the viewport to landscape
    Then Verify the search results page is shown
    And Verify the mobile Filters trigger button is visible

  @low-priority @TC43
  Scenario: The homepage and search results page expose real, distinct SEO meta tags
    Given Admin is on the homepage
    Then Verify the homepage SEO meta tags are present
    When Admin records the homepage meta description
    And Admin is on the search results page
    Then Verify the search results page has distinct SEO meta tags

  # --- Filters panel: structure, chrome & accessibility (see
  # docs/requirements/equipment-listing-filters-ui-automation-requirements.md) ---

  @smoke @FLT-001
  Scenario: Desktop Filters header has no close icon
    Given Admin is on the search results page
    Then Verify the filters sidebar is visible
    And Verify the desktop Filters header has no close icon

  @smoke @FLT-002
  Scenario: Mobile Filters overlay header shows title, Clear All, and a close icon
    Given Admin is on the search results page
    When Admin resizes the viewport to mobile width
    And Admin opens the mobile Filters overlay
    Then Verify the mobile Filters overlay header is complete

  @smoke @FLT-003
  Scenario: Filter sections render in the real order with no Brands section
    Given Admin is on the search results page
    Then Verify the filter sections render in the real order with no Brands section

  @regression @FLT-004
  Scenario: A divider separates each filter section
    Given Admin is on the search results page
    Then Verify a divider separates each filter section

  @regression @FLT-005
  Scenario: Apply Filters button stays pinned while the sidebar scrolls
    Given Admin is on the search results page
    Then Verify the Apply Filters button stays pinned while scrolling

  @regression @FLT-006
  Scenario: The Category section shows an internal scrollbar when its list overflows
    Given Admin is on the search results page
    When Admin expands the "Category" filter section
    Then Verify the Category filter list is internally scrollable

  @regression @FLT-007
  Scenario: Category checkbox rows have consistent spacing
    Given Admin is on the search results page
    When Admin expands the "Category" filter section
    Then Verify the Category checkbox rows have consistent spacing

  @smoke @FLT-008
  Scenario: Closing the mobile Filters overlay via the close icon works
    Given Admin is on the search results page
    When Admin resizes the viewport to mobile width
    And Admin opens the mobile Filters overlay
    And Admin closes the mobile Filters overlay via its close icon
    Then Verify the mobile Filters overlay is closed

  @low-priority @FLT-009
  Scenario: Clear All with no filters selected does not error
    Given Admin is on the search results page
    Then Verify Clear All with no filters selected does not error

  @smoke @FLT-010
  Scenario: Clear All updates results immediately without a separate Apply Filters click
    Given Admin is on the search results page
    Then Verify Clear All applies without a separate Apply Filters click

  @smoke @FLT-011
  Scenario: Expanding a collapsed filter section reveals its options
    Given Admin is on the search results page
    Then Verify the "Model" filter section is collapsed
    When Admin expands the "Model" filter section
    Then Verify the "Model" filter section is expanded

  @smoke @FLT-012
  Scenario: Collapsing an expanded filter section hides its options again
    Given Admin is on the search results page
    When Admin expands the "Model" filter section
    Then Verify the "Model" filter section is expanded
    When Admin expands the "Model" filter section
    Then Verify the "Model" filter section is collapsed

  @regression @FLT-013
  Scenario: Multiple filter sections can be expanded at the same time
    Given Admin is on the search results page
    When Admin expands the "Category" filter section
    And Admin expands the "Model" filter section
    Then Verify the "Category" filter section is expanded
    And Verify the "Model" filter section is expanded

  @regression @FLT-014
  Scenario: A section's selections persist across collapse and re-expand
    Given Admin is on the search results page
    When Admin selects a real category leaf filter
    When Admin expands the "Category" filter section
    Then Verify the "Category" filter section is collapsed
    When Admin expands the "Category" filter section
    Then Verify the "Category" filter section is expanded
    And Verify the selected category leaf filter checkbox is checked

  @regression @FLT-015
  Scenario: Category listing counts render as plain numbers
    Given Admin is on the search results page
    When Admin expands the "Category" filter section
    Then Verify Category listing counts render as plain numbers

  @regression @FLT-016
  Scenario: A zero-count category remains selectable
    Given Admin is on the search results page
    When Admin expands the "Category" filter section
    Then Verify a zero-count category is selectable

  @regression @FLT-017
  Scenario: Model listing counts render as plain numbers
    Given Admin is on the search results page
    When Admin expands the "Model" filter section
    Then Verify Model listing counts render as plain numbers

  @regression @FLT-018
  Scenario: The Model section shows an internal scrollbar when its list overflows
    Given Admin is on the search results page
    When Admin expands the "Model" filter section
    Then Verify the Model filter list is internally scrollable

  @low-priority @FLT-019
  Scenario: Location checkboxes are unchecked by default
    Given Admin is on the search results page
    When Admin expands the "Location" filter section
    Then Verify all Location checkboxes are unchecked by default

  @regression @FLT-020
  Scenario: The Hours/Miles/Kilometers unit label is a fixed compound label
    Given Admin is on the search results page
    When Admin expands the "Hours" filter section
    Then Verify the Hours-Miles unit label is the fixed compound label

  @low-priority @FLT-021
  Scenario: Rapidly toggling a category checkbox stays stable and applies the final state
    Given Admin is on the search results page
    When Admin rapidly toggles a real category leaf filter
    And Admin applies the filters
    Then Verify the results page still renders correctly after the filter action

  @regression @FLT-022
  Scenario: Keyboard Tab order moves logically through an expanded section's rows
    Given Admin is on the search results page
    When Admin expands the "Category" filter section
    Then Verify keyboard Tab order moves through the Category section into the next section

  @low-priority @FLT-023
  Scenario: Escape key does not close the mobile Filters overlay
    Given Admin is on the search results page
    When Admin resizes the viewport to mobile width
    And Admin opens the mobile Filters overlay
    And Admin presses Escape
    Then Verify the mobile Filters overlay is still open

  @regression @FLT-024
  Scenario: A category checkbox toggles via the Space key
    Given Admin is on the search results page
    When Admin expands the "Category" filter section
    Then Verify a category checkbox toggles via the Space key

  @regression @TC13
  Scenario: Reapplying the same category filter does not duplicate its active-filter tag
    Given Admin is on the search results page
    When Admin selects a real category leaf filter
    And Admin applies the filters
    Then Verify the selected category leaf filter tag is shown
    When Admin removes the selected category leaf filter tag
    And Admin selects the same category leaf filter again
    And Admin applies the filters
    Then Verify the selected category leaf filter tag appears exactly once

  @low-priority @TC41
  Scenario: The viewport meta tag does not block pinch-to-zoom
    Given Admin is on the homepage
    Then Verify the viewport meta tag does not disable user zoom

  @low-priority @TC43
  Scenario: The homepage has exactly one H1 heading
    Given Admin is on the homepage
    Then Verify the homepage has exactly one H1 heading
