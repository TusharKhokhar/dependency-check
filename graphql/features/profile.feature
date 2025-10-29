# things.feature

  @profile
Feature: Profile Manager
  As a Profile manager. I want to manage all profile data. So that I can provide profile configurations

  @add
  Scenario: Mutation to add a new profile for profile type driver
    Given A valid graphql addProfile mutation
    When User has provided valid profileInputs
    Then The api should respond with status code
    Then The response contains profile data

  @get
  Scenario: It should send correct graphql query getProfiles
    Given a valid graphql query
    When User has provided valid pagination input
    Then The response status should be 200
    Then The response will contain total number of profiles and profile object in an array

  @get
  Scenario: It should contain profile settings getProfile
    Given a valid graphql query getProfile
    When I request to get profile by valid profile id
    When I called the getProfile query
    Then The response status for getProfile should be 200
    Then I should receive profile with profile settings

  @get
  Scenario: It should not contain profile getProfile when we provide invalid customer and profile id
    When Request to get profile by invalid profile id
    When GraphQL api request to getProfile with invalid ids
    Then I should not receive profile

  Scenario: Successfully add a new profile
    Given I have a valid profile input with isActive set to true
    When I send a request to add profile
    Then the response of profile should have status code 200
    And the response of profile should have isActive set to true
