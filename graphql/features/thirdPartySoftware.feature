@thirdPartySoftware

Feature: CRUD APIs for the ThirdPartySoftware

  Scenario: Successfully retrieve third-party software  
    Given I have valid input to retrieve third-party software
    When I send a request to get the third-party software
    Then the getThirdPartySoftware API response should be successful

  Scenario: Successfully retrieve third-party software with a specific pattern  
    Given I have valid input to retrieve third-party software with a pattern
    When I send a request to get the third-party software
    Then the getThirdPartySoftware API response should return only data matching the pattern

  Scenario: Retrieve third-party software with valid pagination  
    Given I request third-party software with pagination input for page 1 and a limit of 2
    When I send a request to get the third-party software
    Then I should receive at most 2 third-party software entries

  Scenario: Successfully retrieve third-party software sorted by name in descending order  
    Given a valid GraphQL query with pagination to retrieve third-party software sorted in descending order
    When I send a request to get the third-party software
    Then the response should contain third-party software names sorted in descending order

  Scenario: Successfully retrieve third-party software sorted by name in ascending order  
    Given a valid GraphQL query with pagination to retrieve third-party software sorted in ascending order
    When I send a request to get the third-party software
    Then the response should contain third-party software names sorted in ascending order