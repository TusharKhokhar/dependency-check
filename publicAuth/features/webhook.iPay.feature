@webhook-iPay
Feature: Notify clients on iPay88 payment success

  Scenario: Send success message when iPay88 payment is completed
    Given a request body with action ipay88_success
    And We send a request with valid MerchantCode, PaymentId, RefNo
    When the ipay88 request should give status code 200
    Then the ipay88 response should contain message "Transaction Response Added Successfully"
  
  Scenario: Send success message when iPay88 payment is completed on mobile
    Given a request body with action ipay88_success for mobile
    And We send a request with valid MerchantCode, PaymentId, RefNo for mobile
    When the ipay88 request should give status code 200
    Then the ipay88 response should contain message "Transaction Response Added Successfully"
