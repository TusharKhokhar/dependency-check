@AzureadLogin
Feature: Azuread SSO Login and Callback
  As a user, I want to log in using Azuread SSO so that I can access the application securely.

  Scenario: User initiates Azuread SSO login
    Given a user with OrgID "demo" and Tier "standard" for Azuread login
    When the user navigates to the Azuread login endpoint
    Then the application should generate the Azuread authorization URL
    Then the AzureadLogin authorization URL should contain the following:
      | Parameter     | Expected Value                                                      |
      | Base_URL      | https://login.microsoftonline.com/<Tenant_Id>/oauth2/v2.0/authorize |
      | scope         | user.read group.read.all openid profile offline_access              |
      | redirect_uri  | https://api.eprintitsaas.org/auth/callback                          |
      | response_mode | query                                                               |
      | response_type | code                                                                |

  Scenario: User completes Azuread SSO login
    Given the user is redirected to the Azuread callback endpoint with a valid authorization code
    When the Azuread callback endpoint exchanges the code for tokens
    Then the Azuread user is redirected to a URL that includes hashId

  Scenario: Azuread SSO login with the same username as an internal user
    Given one internal user already exists in the system - AzureadLogin
    When the user logs in using Azuread SSO
    Then it should create new user with Azuread provider

  Scenario: User completes Azuread SSO login
    Given one internal user already exists in the system - AzureadLogin
    When the user log in using Azuread SSO
    Then the system should update the Azuread user information