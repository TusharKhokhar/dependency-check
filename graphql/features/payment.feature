@Payment

Feature: Payment

  Scenario: Successful balance retrieval by CBORD
    Given a valid input for CBORD PaymentType, ThingID, CustomerId, and CardNumber
    When the getBalance function is called for CBORD PaymentType
    Then a successful response with balance details should be returned for CBORD PaymentType

  Scenario: Successful balance retrieval by Atrium
    Given a valid input for Atrium PaymentType, ThingID, CustomerId, and CardNumber
    When the getBalance function is called for Atrium PaymentType
    Then a successful response with balance details should be returned for Atrium PaymentType

  Scenario: Successful sendTransaction by CBORD
    Given a valid input for CBORD PaymentType, ThingID, CustomerId, CardNumber, Amount, Device and Currency
    When the sendTransaction function is called for CBORD PaymentType
    Then a successful response with transaction details should be returned for CBORD PaymentType
    Then the PaymentStats record in MongoDB should have status "succeeded"

  Scenario: Successful sendTransaction by Atrium
    Given a valid input for Atrium PaymentType, ThingID, CustomerId, CardNumber, Amount, Device and Currency
    When the sendTransaction function is called for Atrium PaymentType
    Then a successful response with transaction details should be returned for Atrium PaymentType
    Then the PaymentStats record in MongoDB should have status "succeeded"

  Scenario: Failed getBalance retrieval with wrong CardNumber
    Given a valid input for getBalance PaymentType, ThingID, and CustomerId
    And an invalid or non-existent CardNumber for getBalance
    When the getBalance function is called with the wrong CardNumber for CBORD PaymentType
    Then an error response should be returned indicating failure to retrieve the balance

  Scenario: Failed sendTransaction with wrong CardNumber
    Given a valid input for sendTransaction PaymentType, ThingID, and CustomerId
    And an invalid or non-existent CardNumber for sendTransaction
    When the sendTransaction function is called with the wrong CardNumber for CBORD PaymentType
    Then an error response should be returned indicating failure to send the transaction

  Scenario: Successfully add a new payment configuration
    Given I have a valid payment input with isActive set to true
    When I send a request to add payment configuration
    Then the response of payment configuration should have status code 200
    And the response of payment configuration should have isActive set to true

  Scenario: Successfully add a new payment iPay88
    Given I have a valid payment input for iPay88
    When I send a request to add payment configuration for iPay88
    Then the response should return "Hash Created Successfully" with status code 200 and required payment fields

@PortOne
  Scenario: Successfully add a new payment PortOne
  Given I have a valid payment input for PortOne
  When I send a request to add payment configuration for PortOne
  Then the response should have status code 200 and response should have PortOne details
