@atrium
Feature: Send Atrium Transaction
  As a user
  I want to send an Atrium transaction
  So that I can transfer funds

  Scenario: Successful transaction
    Given I have a valid customerId, cardNumber, accountNumber, terminalId, currency, amount, accountMode, and device
    When I call the sendAtriumTransaction function
    Then I should receive a successful response with the transaction details

  Scenario: Failed transaction
    Given I have an invalid customerId, cardNumber, accountNumber, terminalId, currency, amount, accountMode, or device
    When I call the sendAtriumTransaction function
    Then I should receive an error response transaction