@SamlLogin
Feature: Saml SSO Login and Callback
  As a user, I want to log in using Saml SSO so that I can access the application securely.

    Scenario: User initiates Saml SSO login
      Given a user with OrgID "demo" and Tier "standard" for Saml login
      When the user navigates to the Saml login endpoint
      Then the application should generate the Saml authorization URL

    Scenario: User completes Saml SSO login
      Given the user is redirected to the Saml callback endpoint with a valid authorization code
      When the Saml callback endpoint exchanges the code for tokens
      Then the Saml user is redirected to a URL that includes hashId

    Scenario: Saml SSO login with the same username as an internal user
      Given one internal user already exists in the system - SamlLogin
      When the user logs in using Saml SSO
      Then it should create new user with Saml provider

    Scenario: Handle error during samlCallbackHandler processing
        Given A request with redirect error url in saml callback
        When The samlCallbackHandler function is invoked
        Then Redirect request to the user-sign-in error URL with "internal_server_error"

    Scenario: User completes Saml SSO login
    Given one Saml user already exists in the system
    When the user logs in using Saml SSO
    Then the system should update the Saml user information
