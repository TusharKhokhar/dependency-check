Feature: Add new accounts

  As a import handler
  I want to process uploaded CSV files from S3
  So that system can add new accounts

  @accounts
  Scenario: Successfully adding new accounts from CSV file uploaded on s3
    Given the CSV file contains valid accounts data
    When the Lambda function is triggered by the file upload event for accounts
    Then the system should parse the file correctly for accounts
    Then the accounts should be added to the database for accounts
    Then an email should be sent with the import status for accounts
