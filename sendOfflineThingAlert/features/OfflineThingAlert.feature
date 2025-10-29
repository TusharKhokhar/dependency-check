@offlineThingAlert @duplicate
Feature: IoT Device Monitoring
  As a system administrator
  I want to monitor IoT devices
  So that I can track offline devices and duplicate connections

  Scenario: Process offline devices and duplicate connections
    Given there are offline devices in AWS IoT
    And there are duplicate thing connections in CloudWatch logs
    And the database contains Things and Customers data
    When the monitoring handler runs
    Then audit logs should be created for offline devices
    And audit logs should be created for duplicate connections
    And existing audit logs should be cleared for non-duplicate things