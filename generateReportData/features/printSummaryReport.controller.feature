@PrinterUsageSummary
Feature: Printer usage summary

    Scenario: Successfully called the getReports API via generateReportData for Printer Usage Summary Reports
     Given A generateReportData event with reportsData "printer summary" for Printer Usage Summary Reports
     When a calling handler with generateReportData for Printer Usage Summary Reports with a valid payload
     Then the Printer Usage Summary Reports data should be sorted by Device
     Then the Printer Usage Summary Reports response should be sent successfully