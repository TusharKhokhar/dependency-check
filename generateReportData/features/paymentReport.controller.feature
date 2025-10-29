@PaymentReportTransaction
Feature: Payment type summary

  Scenario: Successfully called the getReports API via generateReportData for Payment Transaction Reports
    Given A generateReportData event with reportsData "payment type summary" for Payment Transaction Reports
    When a calling handler with generateReportData for Payment Transaction Reports with a valid payload
    Then the Payment Transaction Reports data should be sorted by PaymentType
    Then the Payment Transaction Reports response should be sent successfully