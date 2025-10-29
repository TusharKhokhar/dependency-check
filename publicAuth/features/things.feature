# things.feature
@global
Feature: Thing Management
  As a Thing Manager
  I want to manage all things data
  So that I can provide related configurations to the client

  Scenario: Get all config data
    Given the thingTagId with the version number
    When I request to get all config data with invalid thingTagId
    Then I should receive a 401 error

  Scenario: ConfigData api response should include DefaultDevice
    Given the valid thingTagId with the version number
    When I request to get all config data with valid thingTagId
    Then I should receive a 200 response and thind has a DefaultDevice Data

  @sts
  Scenario: Get Sts Credentails
    Given the thingName and CustomerId
    When I request the getStsCredentials api
    Then I should receive accessparams in response
