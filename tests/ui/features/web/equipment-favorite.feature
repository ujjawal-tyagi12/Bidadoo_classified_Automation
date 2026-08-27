@equipment-favorite @BIDC-630 @smoke
Feature: Equipment Favorite Icon and Sign-In Prompt

  A visitor can mark an equipment listing as a favorite from either the
  `/search` result cards or the equipment detail page. Both surfaces render
  the identical favorite icon mechanism (a real `star-outline.svg` /
  `star-filled.svg` swap, no `aria-pressed`) and, for a signed-out visitor,
  the same "Welcome Back" sign-in modal — only its subtitle text differs by
  trigger surface. See
  docs/requirements/equipment-favorite-automation-requirements.md for the
  live findings behind every scenario below, including two real,
  confirmed departures from the supplied test sheet: clicking an
  already-favorited icon toggles it OFF (TC9/TC35), not "no change", and a
  successful sign-in from the prompt automatically completes the favorite
  action without a second click.

  @smoke @TC1
  Scenario: A logged-in user can mark equipment as favorite from the listing cards
    Given Admin logs in with valid credentials
    And Admin is on the search results page
    And Admin ensures the first result is not marked as favorite
    When Admin clicks the favorite icon on the first result
    Then Verify the favorite icon on the first result shows as favorited

  @TC1
  Scenario: A logged-in user can mark equipment as favorite from the detail page
    Given Admin logs in with valid credentials
    And Admin is on the search results page
    And Admin opens the first result's detail page
    When Admin clicks the favorite icon on the detail page
    Then Verify the detail page favorite icon shows as favorited

  @smoke @TC2
  Scenario: An anonymous user clicking the listing card favorite icon is prompted to sign in
    Given Admin is on the search results page
    When Admin clicks the favorite icon on the first result
    Then Verify the sign-in dialog is shown
    And Verify the sign-in dialog prompts to add the item to favorites

  @TC2
  Scenario: An anonymous user clicking the detail page favorite icon sees a generic sign-in prompt
    Given Admin is on the search results page
    And Admin opens the first result's detail page
    When Admin clicks the favorite icon on the detail page
    Then Verify the sign-in dialog is shown
    And Verify the sign-in dialog shows a generic sign-in prompt

  @smoke @TC3
  Scenario: Signing in with valid credentials from the favorite prompt logs in and favorites the item
    Given Admin logs in with valid credentials
    And Admin is on the search results page
    And Admin ensures the first result is not marked as favorite
    When Admin's session expires
    And Admin clicks the favorite icon on the first result
    And Admin signs in with valid credentials from the sign-in dialog
    Then Verify the sign-in dialog is hidden
    And Verify the favorite icon on the first result shows as favorited

  @TC7
  Scenario: An expired session re-prompts sign-in when clicking favorite again
    Given Admin logs in with valid credentials
    And Admin is on the search results page
    When Admin's session expires
    And Admin clicks the favorite icon on the first result
    Then Verify the sign-in dialog is shown

  @TC8
  Scenario: A mocked favorite-toggle failure shows a real error without changing the icon
    Given Admin logs in with valid credentials
    And Admin is on the search results page
    And Admin ensures the first result is not marked as favorite
    When the favorite request is mocked to fail
    And Admin clicks the favorite icon on the first result
    Then Verify the favorite error toast is shown
    And Verify the favorite icon on the first result shows as not favorited

  @smoke @TC9
  Scenario: Clicking an already-favorited icon removes it from favorites
    Given Admin logs in with valid credentials
    And Admin is on the search results page
    And Admin ensures the first result is marked as favorite
    When Admin clicks the favorite icon on the first result
    Then Verify the favorite icon on the first result shows as not favorited

  @TC10
  Scenario: Rapid clicks on the favorite icon are handled without error
    Given Admin logs in with valid credentials
    And Admin is on the search results page
    And Admin ensures the first result is not marked as favorite
    When Admin clicks the favorite icon on the first result 4 times rapidly
    Then Verify the favorite icon on the first result ends in a consistent state

  @smoke @TC14
  Scenario: An invalid email shows a real inline validation message in the sign-in prompt
    Given Admin is on the search results page
    When Admin clicks the favorite icon on the first result
    And Admin enters an invalid email in the sign-in dialog
    Then Verify the invalid email message is shown in the sign-in dialog

  @smoke @TC15
  Scenario: A short password shows a real inline validation message in the sign-in prompt
    Given Admin is on the search results page
    When Admin clicks the favorite icon on the first result
    And Admin enters a valid email and a short password in the sign-in dialog
    Then Verify the short password message is shown in the sign-in dialog

  @smoke @TC16
  Scenario: An incorrect password shows a real server error message
    Given Admin is on the search results page
    When Admin clicks the favorite icon on the first result
    And Admin submits the sign-in dialog with a wrong password
    Then Verify the incorrect password message is shown

  @smoke @TC17
  Scenario: A non-existent account shows a real server error message
    Given Admin is on the search results page
    When Admin clicks the favorite icon on the first result
    And Admin submits the sign-in dialog with a non-existent account
    Then Verify the account not found message is shown

  @TC23
  Scenario: A valid email with special characters is accepted by the sign-in prompt
    Given Admin is on the search results page
    When Admin clicks the favorite icon on the first result
    And Admin enters a special-character email and a valid password in the sign-in dialog
    Then Verify the Sign In button is enabled

  @TC24
  Scenario: Long email and password values are accepted with no client-side cap
    Given Admin is on the search results page
    When Admin clicks the favorite icon on the first result
    And Admin enters a long email and password in the sign-in dialog
    Then Verify the Sign In button is enabled

  @smoke @TC26
  Scenario: An empty email field keeps Sign In disabled
    Given Admin is on the search results page
    When Admin clicks the favorite icon on the first result
    And Admin enters a password but leaves the email empty in the sign-in dialog
    Then Verify the Sign In button is disabled

  @smoke @TC27
  Scenario: An empty password field keeps Sign In disabled
    Given Admin is on the search results page
    When Admin clicks the favorite icon on the first result
    And Admin enters an email but leaves the password empty in the sign-in dialog
    Then Verify the Sign In button is disabled

  @smoke @TC35
  Scenario: Removing an already-favorited item clears its favorite state
    Given Admin logs in with valid credentials
    And Admin is on the search results page
    And Admin ensures the first result is marked as favorite
    When Admin clicks the favorite icon on the first result
    Then Verify the favorite icon on the first result shows as not favorited

  @TC36
  Scenario: Favorite state persists across a fresh login session
    Given Admin logs in with valid credentials
    And Admin is on the search results page
    And Admin ensures the first result is marked as favorite
    When Admin's session expires
    And Admin logs in with valid credentials
    And Admin is on the search results page
    Then Verify the favorite icon on the first result persisted as favorited after a fresh login
