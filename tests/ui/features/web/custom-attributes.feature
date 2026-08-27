@custom-attributes @seller-dashboard
Feature: Seller Dashboard - Custom Attributes

  As a seller, I can create internal custom attributes to help track inventory and
  integrations — creating, editing, activating/deactivating them — kept private to my
  organization and never exposed to buyers.

  Background:
    Given Admin logs in with valid credentials
    And Admin opens the Custom Attributes tab

  @smoke @BIDC475-1
  Scenario: Admin can create a Dropdown-type custom attribute with a value
    When Admin starts creating a new custom attribute
    And Admin fills in the Attribute Name
    And Admin selects Attribute type "Dropdown"
    And Admin fills Value 1 with "Good"
    And Admin submits the custom attribute form
    Then Verify the new custom attribute appears in the list as Active

  @BIDC475-2 @BIDC475-43
  Scenario: An empty Attribute Name shows a required error
    When Admin starts creating a new custom attribute
    And Admin blurs the Attribute Name field without entering a value
    Then Verify the Attribute Name required error is shown
    And Verify the custom attribute form cannot be submitted

  @BIDC475-3 @BIDC475-13 @BIDC475-44
  Scenario: An unselected Attribute type keeps the form unsubmittable
    When Admin starts creating a new custom attribute
    And Admin fills in the Attribute Name
    Then Verify the custom attribute form cannot be submitted

  @BIDC475-4 @BIDC475-45
  Scenario: A Dropdown type with no values keeps the form unsubmittable
    When Admin starts creating a new custom attribute
    And Admin fills in the Attribute Name
    And Admin selects Attribute type "Dropdown"
    Then Verify the custom attribute form cannot be submitted

  @BIDC475-6
  Scenario: Admin can view a custom attribute's full details
    Given Admin has created a custom attribute
    When Admin opens the new custom attribute from the list
    Then Verify the custom attribute detail page shows the real Name, Type, and Status

  @BIDC475-7 @BIDC475-30 @BIDC475-31
  Scenario: Admin can edit a custom attribute's name and values, and it persists
    Given Admin has created a custom attribute
    When Admin opens the new custom attribute's row menu
    And Admin clicks Edit from the row menu
    And Admin updates the Attribute Name
    And Admin submits the custom attribute form
    Then Verify the updated custom attribute appears in the list

  @BIDC475-8 @BIDC475-22 @BIDC475-32
  Scenario: Admin can deactivate an active custom attribute with confirmation
    Given Admin has created a custom attribute
    When Admin opens the new custom attribute from the list
    And Admin deactivates the custom attribute
    Then Verify the custom attribute's detail status is "Deactivated"

  @BIDC475-9 @BIDC475-24
  Scenario: Admin can reactivate a deactivated custom attribute
    Given Admin has created a custom attribute
    And Admin opens the new custom attribute from the list
    And Admin deactivates the custom attribute
    When Admin activates the custom attribute
    Then Verify the custom attribute's detail status is "Activated"

  @BIDC475-10
  Scenario: Cancelling custom attribute creation discards it
    When Admin starts creating a new custom attribute
    And Admin fills in the Attribute Name
    And Admin selects Attribute type "Text Field"
    And Admin cancels the custom attribute form
    Then Verify the new custom attribute does not appear in the list

  @BIDC475-11 @BIDC475-26 @BIDC475-34 @BIDC475-48 @BIDC475-51
  Scenario: An Attribute Name over 25 characters shows a length error
    When Admin starts creating a new custom attribute
    And Admin enters a too-long Attribute Name
    Then Verify the Attribute Name length error is shown

  @BIDC474-7
  Scenario: Custom attributes are paginated with 10 rows per page by default
    Then Verify the Custom Attributes default page size is 10

  @BIDC474-14
  Scenario: Unauthorized users are redirected to Login when accessing Custom Attributes directly
    Given Admin logs out
    When Admin attempts to open Custom Attributes directly
    Then Verify Admin is redirected to the Login page

  @BIDC474-26
  Scenario: The Attribute Name field safely handles a SQL-injection-style string
    When Admin starts creating a new custom attribute
    And Admin fills the Attribute Name with a SQL-injection-style string
    Then Verify the custom attributes page did not crash

  @BIDC474-36
  Scenario: The Value field safely handles an XSS-style string
    When Admin starts creating a new custom attribute
    And Admin fills in the Attribute Name
    And Admin selects Attribute type "Dropdown"
    And Admin fills Value 1 with an XSS-style string
    Then Verify the custom attributes page did not crash

  @BIDC475-19 @BIDC475-20 @BIDC475-23 @BIDC475-27 @BIDC475-28 @BIDC475-35 @BIDC475-36 @BIDC475-37 @BIDC475-38 @BIDC475-40 @BIDC475-41 @BIDC475-42 @BIDC475-47 @BIDC475-49 @BIDC475-50 @BIDC475-52
  Scenario: The Value field accepts varied content without special validation
    When Admin starts creating a new custom attribute
    And Admin fills in the Attribute Name
    And Admin selects Attribute type "Dropdown"
    And Admin fills Value 1 with varied content
    And Admin submits the custom attribute form
    Then Verify the new custom attribute appears in the list as Active

  @BIDC475-21
  Scenario: Creating a new custom attribute does not affect an existing one
    Given Admin has created a custom attribute
    When Admin creates a second, different custom attribute
    Then Verify the first custom attribute is still unchanged in the list

  @BIDC475-29
  Scenario: Changing Attribute type during Edit updates the form accordingly
    Given Admin has created a custom attribute
    When Admin opens the new custom attribute's row menu
    And Admin clicks Edit from the row menu
    And Admin selects Attribute type "Text Field"
    Then Verify the Value 1 field is no longer shown

  @BIDC475-5
  Scenario: Creating a duplicate custom attribute shows an error
    Given Admin has created a custom attribute
    When Admin attempts to create a duplicate of the custom attribute
    Then Verify a duplicate attribute name error is shown
