# billingServices.feature
@BillingServices
Feature: BillingServices

    Scenario: Successfully get accounts list
        Given I have valid request parameters for BillingServices
        When I send a request to get the BillingServices
        Then the response of BillingServices should have status code 200
        And the response should contain a list of BillingServices
