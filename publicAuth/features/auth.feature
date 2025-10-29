# auth.feature
@global
Feature: Login API which is used for validating a user and fetch the user's meta data
  this helps to determine user's permissions and settings
  @login
  Scenario: Login API success when a valid username and password is provided
    Given a valid route for login api
    When We send a login request with valid username and password
    Then I should get a success message and login response should contain Print Config Group and Device data
    Then The token should have an expiry time matching the expected duration