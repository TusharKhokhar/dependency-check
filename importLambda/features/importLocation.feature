Feature: Add new locations

  As a import handler
  I want to process uploaded CSV files from S3
  So that system can add new things

  @things
  Scenario: Successfully adding new locations from CSV file uploaded on s3
    Given the CSV file contains valid locations data
    When the Lambda function is triggered by the file upload event for locations
    Then the system should parse the file correctly for locations
    Then the locations should be added to the database for locations
    Then an email should be sent with the import status for locations