@textTranslation
Feature: Text Translation Operations
  As a user of the system
  I want to manage text translation configurations
  So that I can control translation services for documents

  Background:
    Given I have a valid text translation input
    And I have a valid text translation update input
    And I have a valid text translation delete input
    And I have a valid text translation status input
    And I have a valid text translation ID

  Scenario: Add a new text translation configuration
    When I send a request to add the text translation
    Then the response of text translation should have status code 200
    And the response of text translation should contain text translation details

  Scenario: Update an existing text translation configuration
    When I send a request to update the text translation
    Then the response of text translation should have status code 200
    And the response of text translation should contain a success message

  Scenario: Get text translation configuration details
    When I send a request to get the text translation
    Then the response of text translation should have status code 200
    And the retrieved text translation should match the expected text translation

  Scenario: Delete a text translation configuration
    When I send a request to delete the text translation
    Then the response of text translation should have status code 200
    And the response of text translation should contain a success message

  Scenario: Enable/disable a text translation configuration
    When I send a request to change the text translation status
    Then the response of text translation should have status code 200
    And the response of text translation should contain a success message
