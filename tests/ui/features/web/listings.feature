@listings @seller-dashboard
Feature: Seller Dashboard - Equipment Listings (Tabular Format)

  As a seller, I can see and manage all my equipment listings from the Listings tab —
  browse them in a table, filter and search, edit or send them to auction, and be kept
  out entirely if I'm not logged in.

  Background:
    Given Admin logs in with valid credentials

  @smoke @TC1
  Scenario: Admin lands on the Listings section from the Seller Dashboard
    Given Admin opens the Listings tab
    Then Verify the listings table is displayed

  @TC2
  Scenario: Admin lands on the Listings section with the new listing active after submitting
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
    And Admin confirms the submission
    Then Verify the new listing appears in the Listings table

  @smoke @TC3 @TC5 @TC6 @TC7 @TC10
  Scenario: Listings table displays the real columns and row data
    Given Admin opens the Listings tab
    Then Verify the listings table shows the real columns

  @TC4
  Scenario: A Draft listing's checkbox is disabled
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin saves as draft
    And Admin opens the Listings tab
    Then Verify the new draft listing's checkbox is disabled

  @TC4
  Scenario: An Active listing's checkbox reveals the bulk Sell with bidadoo action
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
    And Admin confirms the submission
    And Admin opens the Listings tab
    When Admin checks the new listing's checkbox
    Then Verify the bulk Sell with bidadoo action becomes available

  @TC11
  Scenario: The action menu offers only Edit Listing for a Draft listing
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin saves as draft
    And Admin opens the Listings tab
    When Admin opens the new draft listing's action menu
    Then Verify the action menu shows Edit Listing
    And Verify the action menu does not show Sell with bidadoo

  @TC11
  Scenario: The action menu offers Edit Listing, Sell with bidadoo, and View Listing for an Active listing
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
    And Admin confirms the submission
    And Admin opens the Listings tab
    When Admin opens the new listing's action menu
    Then Verify the action menu shows Edit Listing
    And Verify the action menu shows Sell with bidadoo
    And Verify the action menu shows View Listing

  @smoke @TC12
  Scenario: Edit Listing opens the same wizard pre-filled with the real listing data
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin saves as draft
    And Admin opens the Listings tab
    When Admin opens the new draft listing's action menu
    And Admin clicks Edit Listing in the action menu
    Then Verify the Edit Listing wizard is pre-filled with the listing's data

  @TC13
  Scenario: Sell with bidadoo shows a confirmation dialog, and Cancel leaves the listing untouched
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
    And Admin confirms the submission
    And Admin opens the Listings tab
    And Admin opens the new listing's action menu
    When Admin clicks Sell with bidadoo in the action menu
    Then Verify the Sell with bidadoo confirmation dialog is shown
    When Admin cancels the Sell with bidadoo confirmation
    Then Verify the new listing is still Active

  @TC8 @TC9
  Scenario: Sorting by Price or Updated Date should not break the table
    Given Admin opens the Listings tab
    When Admin clicks the Price sort button
    Then Verify the listings table is still populated
    When Admin clicks the Updated Date sort button
    Then Verify the listings table is still populated

  @smoke @TC14
  Scenario: Filter listings by Status
    Given Admin opens the Listings tab
    When Admin filters listings by Status "Active"
    Then Verify the Status filter is applied

  @TC15 @TC32
  Scenario: Filter listings by Price Range, including boundary values
    Given Admin opens the Listings tab
    When Admin opens the Filter panel
    Then Verify the Price filter defaults to the full available range
    When Admin sets the Price filter to its minimum and maximum boundary values
    Then Verify the Price filter range text reflects the boundary values

  @TC17
  Scenario: Filter listings by Date Range
    Given Admin opens the Listings tab
    When Admin opens the Filter panel
    And Admin filters listings by a valid Listed On date range
    Then Verify the Status filter dialog closes without error

  @TC33
  Scenario: The To date cannot be set before the From date
    Given Admin opens the Listings tab
    When Admin opens the Filter panel
    And Admin picks a Listed On From date
    Then Verify the Listed On To date cannot be set earlier than From

  @TC20
  Scenario: Searching for equipment that doesn't exist shows no results
    Given Admin opens the Listings tab
    When Admin searches Listings for equipment that does not exist
    Then Verify the no-listings-found message is shown

  @TC22
  Scenario: Unauthorized users are redirected to Login when accessing Listings directly
    Given Admin logs out
    When Admin attempts to open the Listings page directly
    Then Verify Admin is redirected to the Login page

  @TC23 @TC24
  Scenario: The search input safely handles SQL-injection- and XSS-style input
    Given Admin opens the Listings tab
    When Admin searches Listings for a SQL-injection-style string
    Then Verify the listings page did not crash
    When Admin searches Listings for an XSS-style string
    Then Verify the listings page did not crash

  @TC35
  Scenario: An Equipment Name with special characters displays correctly in Listings
    Given Admin is on the Create New Listing page
    And Admin fills in Asset Information with a special-characters Equipment Name
    And Admin saves as draft
    And Admin opens the Listings tab
    Then Verify the special-characters listing name is displayed correctly

  @TC36
  Scenario: A very long Equipment Name displays correctly in Listings
    Given Admin is on the Create New Listing page
    And Admin fills in Asset Information with a long Equipment Name
    And Admin saves as draft
    And Admin opens the Listings tab
    Then Verify the long listing name is displayed correctly

  @BIDC298-4
  Scenario: Clear all resets an applied filter back to the unfiltered list
    Given Admin opens the Listings tab
    And Admin filters listings by Status "Active"
    When Admin opens the Filter panel
    And Admin clicks Clear all
    Then Verify no filters are applied

  @BIDC298-6
  Scenario: Cancel discards a filter selection without applying it
    Given Admin opens the Listings tab
    When Admin opens the Filter panel
    And Admin selects Status "Active" without applying
    And Admin cancels the filter panel
    Then Verify no filters are applied

  @BIDC298-8
  Scenario: Listings are paginated with 10 rows per page by default
    Given Admin opens the Listings tab
    Then Verify the default page size is 10

  @BIDC298-9 @BIDC298-20
  Scenario: An Active listing's status can be updated to Expired, reducing its action menu to Edit Listing only
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
    And Admin confirms the submission
    And Admin opens the Listings tab
    When Admin updates the new listing's status to Expired
    Then Verify the new listing's status is Expired
    When Admin opens the new listing's action menu
    Then Verify the action menu shows Edit Listing
    And Verify the action menu does not show Sell with bidadoo
    And Verify the action menu does not show View Listing

  @BIDC298-11
  Scenario: Admin can edit a listing's name and price and the changes persist
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
    And Admin confirms the submission
    And Admin opens the Listings tab
    When Admin opens the new listing's action menu
    And Admin clicks Edit Listing in the action menu
    And Admin updates the Listing Title and Price
    And Admin saves as draft
    And Admin opens the Listings tab
    Then Verify the listing reflects the updated name and price

  @BIDC298-13 @BIDC298-14
  Scenario: Clicking a Reference ID opens a read-only view with an Edit button that leads to the edit form
    Given Admin is on the Create New Listing page
    And Admin fills in valid Asset Information
    And Admin saves as draft
    And Admin opens the Listings tab
    When Admin clicks the new draft listing's Reference ID
    Then Verify the equipment opens in a read-only View Equipment mode
    When Admin clicks the Edit button on the View Equipment page
    Then Verify the Edit Listing wizard is pre-filled with the listing's data
