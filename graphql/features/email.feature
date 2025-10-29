@email
Feature: Email

    Scenario: Successfully add a new email
        Given I have a valid email input
        When I send a request to add the email
        Then the response of email should have status code 200
        And the response of email should contain email details

    Scenario: Successfully update an email
        Given I have a valid email update input
        When I send a request to update the email
        Then the response of email should have status code 200
        And the response of email should contain a success message

    Scenario: Successfully delete an email
        Given I have a valid email delete input
        When I send a request to delete the email
        Then the response of email should have status code 200
        And the response of email should contain a success message

    Scenario: Successfully change the status of an email
        Given I have a valid email status input
        When I send a request to change the email status
        Then the response of email should have status code 200

    Scenario: Successfully get email details
        Given I have a valid email ID
        When I send a request to get the email
        Then the response of email should have status code 200
