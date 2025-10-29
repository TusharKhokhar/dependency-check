@InnovativeLogin
Feature: Login with Innovative

    This API is used to login users with Innovative identity providers and will return a hash ID on successful login.

    Scenario: Invalid request body for Innovative login for any LoginType
        Given a request body "<requestBody>" for Innovative login
        When I send a POST request for Innovative login
        Then The response status should be <status> for Innovative login
        And The response should contain "<expectedMessage>" for Innovative login

        Examples:
            | requestBody                 | status | expectedMessage                      |
            | without authId              | 400    | Auth provider is not configured      |
            | without barcode             | 400    | The provided credentials are invalid |
            | without pin                 | 400    | The provided credentials are invalid |
            | with invalid barcode or pin | 400    | The provided credentials are invalid |

    Scenario: Incorrect authProvider configuration for Innovative login
        Given an authProvider "<configuration>" for Innovative login
        When I send a POST request for Innovative login
        Then The response status should be <status> for Innovative login
        And The response should contain "<expectedMessage>" for Innovative login
        And The error should stored in AuditLogs collection for Innovative login

        Examples:
            | configuration             | status | expectedMessage                |
            | with invalid ClientID     | 400    | Invalid provider configuration |
            | with invalid ClientSecret | 400    | Invalid provider configuration |

    Scenario: Incorrect connection details in authProvider configuration for Innovative login
        Given an authProvider with invalid ServerBaseURL to login with Innovative
        When I send a POST request for Innovative login
        Then The response status should be 400 for Innovative login
        And The response should contain one of the messages for Innovative login

            | The connection was refused by the server. Please check configuration |
            | The connection attempt timed out. Please check configuration         |
            | DNS lookup failed for hostname. Please check configuration           |

    Scenario: Successful Innovative login
        Given a request body "with valid credentials" for Innovative login
        And an authProvider "with valid configuration" for Innovative login
        When I send a POST request for Innovative login
        Then The response status should be 200 for Innovative login
        And The response should contain hashId for Innovative login

    Scenario: Assign user to a group based on matched GroupAssignmentRules
        Given an authentication provider is configured with GroupAssignmentRules, and it contains a group named 'Test Users' with specific matching conditions for Innovative login
        When I send a POST request for Innovative login
        Then The user should be assigned to the "Test Innovative Users" if rules matches for this group for Innovative login