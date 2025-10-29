@FTP
Feature: FTP

    Scenario: Successfully add a new FTP
        Given I have a valid FTP input
        When I send a request to add the FTP
        Then the response of FTP should have status code 200
        And the response of FTP should contain FTP details

    Scenario: Successfully update an FTP
        Given I have a valid FTP update input
        When I send a request to update the FTP
        Then the response of FTP should have status code 200
        And the response of FTP should contain a success message

    Scenario: Successfully change the status of an FTP
        Given I have a valid FTP status input
        When I send a request to change the FTP status
        Then the response of FTP should have status code 200

    Scenario: Successfully get FTP details
        Given I have a valid FTP ID
        When I send a request to get the FTP
        Then the response of FTP should have status code 200

    Scenario: Successfully delete an FTP
        Given I have a valid FTP delete input
        When I send a request to delete the FTP
        Then the response of FTP should have status code 200
        And the response of FTP should contain a success message