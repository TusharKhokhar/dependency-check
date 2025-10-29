@webhook-braintree
Feature: Notify clients on braintree payment success

  Scenario: Send success message when braintree payment is completed
    Given a request body with action submitted_for_settlement
    And We send a request with valid TransactionID, Currency, Status for braintree
    When the braintree request should give status code 200
