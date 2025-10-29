# accountSync.feature
@AccountSync
Feature: AccountSync

    Scenario: Successfully add a new accountSync
        Given I have a valid accountSync input
        When I send a request to add the accountSync
        Then the response of accountSync should have status code 200
        And the response of accountSync should contain accountSync details

    Scenario: Successfully update an accountSync
        Given I have a valid accountSync update input
        When I send a request to update the accountSync
        Then the response of accountSync should have status code 200
        And the response of accountSync should contain a success message

    Scenario: Successfully delete an accountSync
        Given I have a valid accountSync delete input
        When I send a request to delete the accountSync
        Then the response of accountSync should have status code 200
        And the response of accountSync should contain a success message

    Scenario: Successfully change the status of an accountSync
        Given I have a valid accountSync status input
        When I send a request to change the accountSync status
        Then the response of accountSync should have status code 200

    Scenario: Successfully get accountSync details
        Given I have a valid accountSync ID
        When I send a request to get the accountSync
        Then the response of accountSync should have status code 200
