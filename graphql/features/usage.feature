# usage.feature
@usage
Feature: Usage Management

  @addUsage
  Scenario: Mutation to add a new usage data
    Given A valid graphql addUsage mutation
    When User has provided valid usageInput
    Then The api should respond with status code 200 for addUsage
    Then The response contains usage data
    Then Verify if the usage added correctly
    Then Verify orientation, BillingAccountId and BillingAccountName exists in the response

  Scenario: Update the Orientation if there is a null value in the print configuration.
    Given A valid graphql addUsage mutation with null Orientation
    When User has provided valid usageInput where Orientation is null
    Then The api should respond with status code 200 with null Orientation
    Then A valid usage object with a same ReleaseCode and SystemFileName
    Then The Print Orientation should be set correctly based on the JobList if the Print configuration Orientation is null.
    
  Scenario: GroupQuotas is an empty array for user
    Given a user "admin" with an empty GroupQuotas
    When User has provided valid usageInput
    Then The api should respond with status code 200 for addUsage
    Then it should deduct balance from current balance

  Scenario: GroupQuotas field is not exist for user
    Given a user "admin" with an non-exsit GroupQuotas
    When User has provided valid usageInput
    Then The api should respond with status code 200 for addUsage
    Then it should deduct balance from current balance

   Scenario: Update the Orientation if there is a AsSaved value in the print configuration.
    Given A valid graphql addUsage mutation with AsSaved Orientation
    When User has provided valid usageInput where Orientation is AsSaved
    Then The api should respond with status code 200 with AsSaved Orientation
    Then A valid usage object with a same ReleaseCode and SystemFileName with AsSaved Orientation
    Then The Print Orientation should be Portrait correctly based on the JobList if the Print configuration Orientation is AsSaved.

  @RaceCondition
  Scenario: Race condition on addUsage API with DebitBalance
    Given a user "admin" with a valid usage input and has selected DebitBalance as the payment method for printing
    When the addUsage API is invoked concurrently
    Then the user's balance should be correctly deducted from DebitBalance, even under concurrent usage
    And each addUsage API call should respond with a 200 status code

  @RaceCondition
  Scenario: Race condition on addUsage API with QuotaBalance
    Given a user "admin" with a valid usage input and has selected QuotaBalance as the payment method for printing
    When the addUsage API is invoked concurrently
    Then the user's balance should be correctly deducted from QuotaBalance, even under concurrent usage
    And each addUsage API call should respond with a 200 status code

  Scenario: Successfully retrieve filtered Usage by transactionType
    Given I have valid request parameters including a transactionType credit_card filter for getUsages
    When I send a request to fetch the getUsages
    Then the response should contain a list of getUsages matching the filter

  Scenario: Successfully retrieve filtered Usage by documentName
    Given I have valid request parameters including a documentName filter for getUsages
    When I send a request to fetch the getUsages
    Then the response should contain a list of getUsages matching the filter by documentName

  Scenario: Successfully retrieve filtered Usage by transactionBy
    Given I have valid request parameters including a transactionBy filter for getUsages
    When I send a request to fetch the getUsages
    Then the response should contain a list of getUsages matching the filter by transactionBy
