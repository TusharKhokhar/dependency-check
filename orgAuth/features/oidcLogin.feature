@OidcLogin
Feature: Oidc SSO Login and Callback
  As a user, I want to log in using Oidc SSO so that I can access the application securely.

  Scenario: User initiates Oidc SSO login
    Given a user with OrgID "demo" and Tier "standard" for Oidc login
    When the user navigates to the Oidc login endpoint
    Then the application should generate the Oidc authorization URL

  Scenario: User completes Oidc SSO login
    Given the user is redirected to the Oidc callback endpoint with a valid authorization code
    When the Oidc callback endpoint exchanges the code for tokens
    Then the Oidc user is redirected to a URL that includes hashId

  Scenario: Oidc SSO login with the same username as an internal user
    Given one internal user already exists in the system - OidcLogin
    When the user logs in using Oidc SSO
    Then it should create new user with Oidc provider

  Scenario: Handle error during common controller processing if redirect url is passed
    Given A request with redirect error url in common controller
    When The redirectCallback function is invoked with redirect url
    Then Redirect to the error URL with "Request failed"

  Scenario: OIDC Login with Valid Additional scope
    Given a user with OrgID "demo" and Tier "standard" for Oidc login with additional scope
    When The OIDC configuration with valid additional scope
    Then The final scope should be 'openid profile email offline_access'

  Scenario: OIDC login with a valid additional scope, using one identical key and one different key
    Given a user with OrgID "demo" and Tier "standard" for Oidc login with identical key
    When The OIDC configuration with valid additional scope
    Then The final scope should be 'openid profile email offline_access'

  Scenario: OIDC login with a null additional scope
    Given a user with OrgID "demo" and Tier "standard" for Oidc login null additional scope
    When The OIDC configuration with null additional scope
    Then The final scope should be 'openid profile email'

  Scenario: Oidc SSO login with the same username as an Oidc user
    Given one Oidc user already exists in the system
    When the user logs in using Oidc SSO
    Then it should not create new Oidc user

  Scenario: Handle error during OIDC callback processing
    Given A request with invalid cookies
    When The redirectCallback function is invoked
    Then The error should stored in AuditLogs collection for oidc login

  Scenario: Handle error during common controller processing if redirect url is black listed
    Given A request with invalid redirect url in common controller
    When The redirectCallback function is invoked
    Then Redirect to the error URL with "Unauthorized"

  Scenario: Handle error during common controller processing if redirect url is not passed
    Given A request without redirect url in common controller
    When The redirectCallback function is invoked
    Then Redirect to the error user-sign-in URL with "Request failed"

  Scenario: OIDC SSO login with an existing OIDC user
    Given an OIDC user already exists in the system and is logged in
    When the user logs in with a valid OIDC SSO
    Then the system should update the OIDC user information

  Scenario: User initiates Oidc SSO login with additional request parameters
    Given a user with OrgID "demo" and Tier "standard" for Oidc login for additional request parameters
    When user initiates Oidc SSO login
    Then the application should generate the Oidc authorization URL with additional request parameters

  Scenario: OIDC SSO login with Custom Parameter
    Given a user with OrgID "demo" and Tier "standard" for Oidc login with Custom parameters
    When user initiates Oidc SSO login
    Then the application should generate the Oidc authorization URL with Custom Parameter