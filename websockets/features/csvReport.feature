@CSVReport
Feature: CSV Report

  Scenario: Successfully call getReports API via websocket
    Given A WebSocket event with routeKey "sendmessage" and actionItem "getReports" for csvReport
    When a calling handler with valid payload
    Then the report generation Lambda should be invoked
    