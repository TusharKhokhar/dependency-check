@jobList
Feature: JobList Management
  As a user of the system
  I want to be able to update job lists
  So that I can manage print jobs effectively

  Scenario: Successfully update a jobList
    Given I have a valid jobList input
    When I send a request to update the jobList
    Then the response of jobList should have status code 200
    And the response of jobList should contain success message
