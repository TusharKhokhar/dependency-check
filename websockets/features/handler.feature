@WebSocketHandler
Feature: WebSocket Handler

  Scenario: lmsValidate method throws an error
    Given A WebSocket event with routeKey "sendmessage" and actionItem "lmsValidateSession"
    When The lmsValidate method throws an error
    Then The error should be logged