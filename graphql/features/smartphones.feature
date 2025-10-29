@smartphone
Feature: smartphone

    Scenario: Successfully add a new smartphone
        Given I have a valid smartphone input
        When I send a request to add the smartphone
        Then the response of smartphone should have status code 200 and response should have smartphone details

    Scenario: Successfully update an smartphone
        Given I have a valid smartphone update input
        When I send a request to update the smartphone
        Then the response of smartphone should have status code 200 and the response should contain a success message

    Scenario: Successfully change the status of an smartphone
        Given I have a valid smartphone status input
        When I send a request to change the smartphone status
        Then the response of smartphone should have status code 200

    Scenario: Successfully get smartphone details
        Given I have a valid smartphone ID
        When I send a request to get the smartphone
        Then the response of smartphone should have list of smartphone

    Scenario: Successfully delete an smartphone
        Given I have a valid smartphone delete input
        When I send a request to delete the smartphone
        Then the response of smartphone deletion should have status code 200 and the response should contain a success message
