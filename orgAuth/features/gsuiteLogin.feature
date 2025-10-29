@GsuiteLogin
Feature: Gsuite SSO Login and Callback
  As a user, I want to log in using Gsuite SSO so that I can access the application securely.

  Scenario: User initiates Gsuite SSO login
    Given a user with OrgID "demo" and Tier "standard"
    When the user navigates to the Gsuite login endpoint
    Then the application should generate the Gsuite authorization URL
    Then the authorization URL should contain the following:
      | Parameter     | Expected Value                                                                                  |
      | Base URL      | https://accounts.google.com/o/oauth2/v2/auth                                                    |
      | access_type   | offline                                                                                         |
      | scope         | https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile |
      | prompt        | consent                                                                                         |
      | response_type | code                                                                                            |
      | redirect_uri  | https://api.eprintitsaas.org/auth/callback                                                      |

  Scenario: User completes Gsuite SSO login
    Given the user is redirected to the Gsuite callback endpoint with a valid authorization code
    When the callback endpoint exchanges the code for tokens
    Then the user is redirected to a URL that includes hashId

  Scenario: Gsuite SSO login with the same username as an internal user
    Given one internal user already exists in the system
    When the user logs in using Gsuite SSO
    Then then it should create new user with Gsuite provider

  Scenario: Gsuite SSO login with the same username as an Gsuite user
    Given one Gsuite user already exists in the system
    When the user logs in using Gsuite SSO
    Then then it should not create new user
  
  Scenario: User completes Gsuite SSO login
    Given one Gsuite user already exists in the system
    When the user logs in using Gsuite SSO
    Then the system should update the Gsuite user information