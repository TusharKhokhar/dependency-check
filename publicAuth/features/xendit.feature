@webhook-xendit
Feature: Notify clients on xendit payment success

  Scenario: Send success message when xendit payment is completed
    Given a request body with action PAID
    And We send a request with valid TransactionID, Currency, Status
    When the xendit request should give status code 200
    Then the xendit response should contain message "OK"
