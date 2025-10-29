# auditLogs.feature
@auditLogs
Feature: auditLogs

    Scenario: Successfully retrieve filtered auditLogs
      Given I have valid request parameters including a message filter for auditLogs
      When I send a request to fetch the auditLogs
      Then the response should have a status code of 200
      And the response should contain a list of auditLogs matching the filter
