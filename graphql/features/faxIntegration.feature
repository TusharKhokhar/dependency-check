@FaxIntegration
Feature: Fax Integration Management

    Scenario: Successfully add a new fax integration
        Given I have a valid fax integration input
        When I send a request to add the fax integration
        Then the response of fax integration should have status code 200
        And the response of fax integration should contain fax integration details

    Scenario: Successfully update an fax integration
        Given I have a valid fax integration update input
        When I send a request to update the fax integration
        Then the response of fax integration should have status code 200
        And the response of fax integration should contain a success message

    Scenario: Successfully get fax integration details
        Given I have a valid fax integration ID
        When I send a request to get the fax integration
        Then the response of fax integration should have status code 200

    Scenario: Successfully change the status of an fax integration
        Given I have a valid fax integration status input
        When I send a request to change the fax integration status
        Then the response of fax integration should have status code 200

    Scenario: Successfully delete an fax integration
        Given I have a valid fax integration delete input
        When I send a request to delete the fax integration
        Then the response of fax integration should have status code 200
        And the response of fax integration should contain a success message
