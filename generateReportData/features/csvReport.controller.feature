@csvReport
Feature: CSV Report

  Scenario: Successfully call getReports API via generateReportData
    Given A generateReportData event with reportsData "csv report" for csvReport
    When a calling handler with valid payload
    Then the report upload Successfully and send dataUrlPath
    