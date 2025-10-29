@socket
Feature: Send success to connected clients

  Scenario: Send success message when action is ippprint
    Given a request body with action "ippprint"
    When I send a POST request to sendSuccessToConnectedClients
    Then the response should contain message "Job status sent successfully"