@proton
Feature: CRUD APIs for the Proton integration
  Scenario: Successfully add a new proton
    Given I have a valid proton input
    When I send a request to add the proton
    Then the response should have status code 200

  Scenario: Successfully update a proton
    Given I have a valid proton update input
    When I send a request to update the proton
    Then the response should have status code 200
    And the response should contain a success message

  Scenario: Successfully get a proton
    Given I have a valid proton get input
    When I send a request to get the proton
    Then the response should have status code 200

  Scenario: Successfully change the status of a proton
    Given I have a valid proton status input
    When I send a request to change the proton status
    Then the response should have status code 200

  Scenario: Successfully delete a proton
    Given I have a valid proton delete input
    When I send a request to delete the proton
    Then the response should have status code 200
    And the response should contain a success message