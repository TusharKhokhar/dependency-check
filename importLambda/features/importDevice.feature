Feature: Add new devices

  As a import handler
  I want to process uploaded CSV files from S3
  So that system can add new devices

  @devices
  Scenario: Successfully adding new devices from CSV file uploaded on s3
    Given the CSV file contains valid devices data
    When the Lambda function is triggered by the file upload event for devices
    Then the system should parse the file correctly for devices
    Then the devices should be added to the database for devices
    Then an email should be sent with the import status for devices