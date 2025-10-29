# accounts.feature
@Accounts
Feature: Accounts

    Scenario: Successfully add a new account
        Given I have a valid account input
        When I send a request to add the account
        Then the response of account should have status code 200
        And the response of account should contain account details

    Scenario: Successfully update an account
        Given I have a valid account update input
        When I send a request to update the account
        Then the response of account should have status code 200
        And the response of account should contain a success message

    Scenario: Successfully delete an account
        Given I have a valid account delete input
        When I send a request to delete the account
        Then the response of account should have status code 200
        And the response of account should contain a success message

    Scenario: Successfully change the status of an account
        Given I have a valid account status input
        When I send a request to change the account status
        Then the response of account should have status code 200

    Scenario: Successfully get account details
        Given I have a valid account ID
        When I send a request to get the account
        Then the response of account should have status code 200

    Scenario: Successfully get accounts list
        Given I have valid request parameters for accounts
        When I send a request to get the accounts
        Then the response of account should have status code 200
        And the response should contain a list of accounts

    @importAccount
    Scenario: calling importAccount api for csv template
    Given a valid graphql query for importAccount
    When user provide a valid input for importAccount
    When user called the importAccount query
    Then response should be status 200 for importAccount api
    Then we get the base64 as the response for importAccount api
