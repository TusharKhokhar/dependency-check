@PolarisLogin
Feature: Login with PolarisLogin

    This API is used to login users with PolarisLogin identity providers and will return a hash ID on successful login.

    Scenario: Invalid request body for Polaris login for any LoginType
        Given a request body "<requestBody>" for Polaris login
        When I send a POST request for Polaris login
        Then The response status should be <status> for Polaris login
        And The response should contain "<expectedMessage>" for Polaris login

        Examples:
            | requestBody                      | status | expectedMessage                      |
            | without authId                   | 400    | Auth provider is not configured      |
            | without barcode                  | 400    | The provided credentials are invalid |
            | without password                 | 400    | The provided credentials are invalid |
            | with invalid barcode or password | 400    | The provided credentials are invalid |

    Scenario: Incorrect connection details in authProvider configuration for Polaris login
        Given an authProvider with invalid Host or Port for Polaris login
        When I send a POST request for Polaris login
        Then The response status should be 400 for Polaris login
        And The response should contain one of the messages for Polaris login
            | The connection was refused by the server. Please check configuration |
            | The connection attempt timed out. Please check configuration         |
            | DNS lookup failed for hostname. Please check configuration           |

    Scenario: Incorrect authProvider configuration for PolarisLogin login
        Given an authProvider "<configuration>" for Polaris login
        When I send a POST request for Polaris login
        Then The response status should be <status> for Polaris login
        And The response should contain "<expectedMessage>" for Polaris login
        And The error should stored in AuditLogs collection for for Polaris login

        Examples:
            | configuration                                                         | status | expectedMessage                |
            | with invalid PAPIAccessId                                             | 400    | Invalid provider configuration |
            | with invalid PAPIAccessKey                                            | 400    | Invalid provider configuration |
            | with LoginType BarcodeOnly and Invalid Username or Password or Domain | 400    | Invalid provider configuration |


    Scenario: Successful PolarisLogin login
        Given a request body "with valid credentials" for Polaris login
        And an authProvider "with valid configuration" for Polaris login
        When I send a POST request for Polaris login
        Then The response status should be 200 for Polaris login
        And The response should contain hashId for Polaris login

    Scenario: Assign user to a group based on matched GroupAssignmentRules in Polaris login
        Given an authentication provider is configured with GroupAssignmentRules, and it contains a group named 'Test Users' with specific matching conditions in Polaris login
        When I send a POST request for Polaris login
        Then The user should be assigned to the "Test Polaris Users" if rules matches for this group in Polaris login