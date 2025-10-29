Feature: Testing Lambda function for dashboard data aggregation

  Background:
    Given the dashboardDataAggregator is invoked daily

  Scenario: Lambda function correctly calculates the usage for last 28 days
    When the Lambda function executes successfully
    Then it calculates the date range as the last 28 days excluding the current day
    And the data stored in the AggregatedDashboardUsage collection has the correct structure

  Scenario: No active customers in the database
    Given there is no active customers
    When the Lambda function executes successfully
    Then no data is stored in the AggregatedDashboardUsage collection

  Scenario: No usage data exists for a customer
    Given there are active customers but no usage data
    When the Lambda function executes successfully
    Then the data stored for those customers in the AggregatedDashboardUsage collection is empty

  Scenario: Aggregated data is updated correctly in AggregatedDashboardUsage collection
    Given there are active customers and usage data exists
    When the Lambda function executes successfully
    Then the AggregatedDashboardUsage collection is updated with the correct data

  Scenario: Lambda function encounters a database error
    When the Lambda function throws an error
    Then an error is logged and the process terminates gracefully
