Feature: Add new things

  As a import handler
  I want to process uploaded CSV files from S3
  So that system can add new things

  @things
  Scenario: Successfully adding new things from CSV file uploaded on s3
    Given the CSV file contains valid things data
    When the Lambda function is triggered by the file upload event for things
    Then the system should parse the file correctly for things
    Then the things should be added to the database for things
    Then an email should be sent with the import status for things