@atrium
Feature: Get Atrium Balance
  As a user
  I want to get the Atrium balance
  So that I can check my current balance

  Scenario: Successful balance retrieval
    Given I have a valid customerId, terminalId, accountMode, accountNumber, and cardNumber
    When I call the getAtriumBalance function
    Then I should receive a successful response with my balance details

  Scenario: Failed balance retrieval
    Given I have an invalid customerId, terminalId, accountMode, accountNumber, or cardNumber
    When I call the getAtriumBalance function
    Then I should receive an error response balance retrieval