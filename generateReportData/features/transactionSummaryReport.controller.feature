@KioskTransaction
Feature: transaction summary report

  Scenario: Successfully called the getReports API via generateReportData for Kiosk Transaction Reports
    Given A generateReportData event with reportsData "transaction summary report" for Kiosk Transaction Reports
    When a calling handler with generateReportData for Kiosk Transaction Reports with a valid payload
    Then the Kiosk Transaction Reports data should be sorted by TransactionType
    Then the Kiosk Transaction Reports response should be sent successfully

  Scenario: Filter Kiosk Transaction Reports by PaymentType
    Given a generateReportData event with "transaction summary report" and PaymentType filter "CBORD"
    When the handler is called for Kiosk Transaction Reports
    Then it should return data filtered by PaymentType like "CBORD" and "cbord"