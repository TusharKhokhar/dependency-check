Feature: SMS Processing Lambda Function
  As a Cloud SaaS platform
  I want to send SMS messages to customers
  And audit any failed messages
  So that I can track and troubleshoot delivery issues

  Background:
    Given the Lambda function is configured with an alert topic ARN
    And the Lambda function is configured with an API key

  Scenario: Successfully sending a single SMS message
    Given I have a valid SMS message in the SQS queue
      | phoneNumber | messageBody       | environment | customerId                |
      | 1234567890  | Test SMS message  | dev         | 5f7b3a2e1d8c5b6a3f9e4d2c |
    When the Lambda function processes the message
    Then the SMS should be sent successfully
    And the success counter should be incremented
    And no failure should be recorded
    And no alert should be sent

  Scenario: Successfully sending multiple SMS messages in a batch
    Given I have multiple SMS messages in the SQS queue
      | phoneNumber | messageBody        | environment | customerId                |
      | 1234567890  | Test SMS message 1 | dev         | 5f7b3a2e1d8c5b6a3f9e4d2c |
      | 0987654321  | Test SMS message 2 | prod        | 6e8c5a3f2d1b7e9a4d6c3f8b |
    When the Lambda function processes the messages
    Then all SMS messages should be sent successfully
    And the success counter should equal the number of messages
    And no failures should be recorded
    And no alerts should be sent

  Scenario: Handling missing required parameters
    Given I have an SMS message missing the phone number
      | messageBody      | environment | customerId                |
      | Test SMS message | dev         | 5f7b3a2e1d8c5b6a3f9e4d2c |
    When the Lambda function processes the message
    Then the SMS should not be sent
    And the failure counter should be incremented
    And an alert should be sent with the error details
    And the audit API should be called with the error information

  Scenario: Handling SNS publish errors
    Given I have a valid SMS message in the SQS queue
      | phoneNumber | messageBody       | environment | customerId                |
      | 1234567890  | Test SMS message  | dev         | 5f7b3a2e1d8c5b6a3f9e4d2c |
    And the SNS service will fail with error "SNS publish failed"
    When the Lambda function processes the message
    Then the failure counter should be incremented
    And an alert should be sent with the error details
    And the audit API should be called with the error information

  Scenario Outline: Calling the correct environment-specific audit API endpoint
    Given I have a valid SMS message in the SQS queue
      | phoneNumber | messageBody       | environment   | customerId                |
      | 1234567890  | Test SMS message  | <environment> | 5f7b3a2e1d8c5b6a3f9e4d2c |
    And the SNS service will fail
    When the Lambda function processes the message
    Then the audit API should be called with the "<api_endpoint>" endpoint

    Examples:
      | environment | api_endpoint           |
      | dev         | api.eprintitsaas.org   |
      | qa          | api.eprintitsaas.net   |
      | prod        | api.eprintitsaas.com   |

  Scenario: Handling audit API errors gracefully
    Given I have a valid SMS message in the SQS queue
      | phoneNumber | messageBody       | environment | customerId                |
      | 1234567890  | Test SMS message  | dev         | 5f7b3a2e1d8c5b6a3f9e4d2c |
    And the SNS service will fail
    And the audit API will fail with a network error
    When the Lambda function processes the message
    Then the Lambda function should complete execution
    And the failure counter should be incremented
    And an alert should be sent with the error details

  Scenario: Handling missing customerId in metadata
    Given I have an SMS message missing the customerId
      | phoneNumber | messageBody       | environment |
      | 1234567890  | Test SMS message  | dev         |
    And the SNS service will fail
    When the Lambda function processes the message
    Then the Lambda function should complete execution
    And a warning about missing customerId should be logged
    And the failure counter should be incremented

  Scenario: Handling malformed JSON in SQS message body
    Given I have an SQS message with malformed JSON
    When the Lambda function processes the message
    Then the Lambda function should complete execution
    And the failure counter should be incremented
    And an alert should be sent with the parsing error details

  Scenario: Handling empty Records array
    Given I have an empty Records array in the event
    When the Lambda function processes the event
    Then the Lambda function should complete execution
    And no success or failure should be recorded

  Scenario: Handling null or undefined event
    Given I have a null event
    When the Lambda function processes the event
    Then the Lambda function should complete execution
    And no success or failure should be recorded

  Scenario: Sending alerts with the correct information
    Given I have a valid SMS message in the SQS queue
      | phoneNumber | messageBody       | environment | customerId                |
      | 1234567890  | Test SMS message  | dev         | 5f7b3a2e1d8c5b6a3f9e4d2c |
    And the SNS service will fail with error "SNS publish failed"
    When the Lambda function processes the message
    Then an alert should be sent to the configured topic
    And the alert should contain the error message
    And the alert should contain the message ID
    And the alert should contain the original message body
    And the alert should contain a timestamp
