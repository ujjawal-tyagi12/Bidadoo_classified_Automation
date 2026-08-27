@login @seller-registration
Feature: Seller Registration - Login

  As a seller, I can log in to my account through the Login screen, with the
  form validating my Email and Password before ever contacting the server,
  and the server rejecting wrong or unknown credentials with a clear reason.

  @smoke @TC-LOGIN-1
  Scenario: Valid credentials log the seller in and land on the dashboard
    When Admin logs in with valid credentials
    Then Verify Admin is redirected to the Seller Dashboard

  @smoke @TC-LOGIN-2
  Scenario: Login stays disabled until Email and Password are both valid
    Given Admin is on the Login page
    Then Verify the Login button is disabled
    When Admin fills in a well-formed Email and Password
    Then Verify the Login button is enabled

  @TC-LOGIN-3
  Scenario: An invalid Email format is rejected before submission
    Given Admin is on the Login page
    When Admin fills in Login credentials with an invalid Email format
    Then Verify the email format error is shown
    And Verify the Login button is disabled

  @TC-LOGIN-4
  Scenario: A Password under the minimum length is rejected before submission
    Given Admin is on the Login page
    When Admin fills in Login credentials with a Password under the minimum length
    Then Verify the password length error is shown
    And Verify the Login button is disabled

  @TC-LOGIN-5
  Scenario: The wrong Password for an existing account is rejected
    Given Admin is on the Login page
    When Admin attempts to log in with the wrong Password
    Then Verify the incorrect password error is shown

  @TC-LOGIN-6
  Scenario: An unregistered Email is rejected
    Given Admin is on the Login page
    When Admin attempts to log in with an unregistered Email
    Then Verify the account not found error is shown

  @TC-LOGIN-7
  Scenario: Password visibility can be toggled
    Given Admin is on the Login page
    When Admin fills in a well-formed Email and Password
    Then Verify the Password field is masked
    When Admin toggles password visibility
    Then Verify the Password field is visible

  @TC-LOGIN-8
  Scenario: Remember Me can be checked
    Given Admin is on the Login page
    When Admin checks Remember Me
    Then Verify Remember Me is checked
