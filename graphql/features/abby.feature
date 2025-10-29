@Abby
Feature: Abby

    Scenario: Successfully add a new abby
        Given I have a valid abby input
        When I send a request to add the abby
        Then the response of abby should have status code 200
        And the response of abby should contain abby details

    Scenario: Successfully update an abby
        Given I have a valid abby update input
        When I send a request to update the abby
        Then the response of abby should have status code 200
        And the response of abby should contain a success message

    Scenario: Successfully change the status of an abby
        Given I have a valid abby status input
        When I send a request to change the abby status
        Then the response of abby should have status code 200

    Scenario: Successfully get abby details
        Given I have a valid abby ID
        When I send a request to get the abby
        Then the response of abby should have status code 200

    Scenario: Successfully delete an abby
        Given I have a valid abby delete input
        When I send a request to delete the abby
        Then the response of abby should have status code 200
        And the response of abby should contain a success message