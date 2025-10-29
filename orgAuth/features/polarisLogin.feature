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
            | Invalid provider configuration                                       |

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

    Scenario: Assign user to a group based on matched EasyBooking group rules in Polaris login
        Given an EasyBooking group is created with specific matching conditions for Polaris login
        When I send a POST request for Polaris login
        Then The system should evaluate the EasyBooking group conditions and assign the user to the matching group based on the defined rules for Polaris login

    Scenario: Handle user login when AllowUserCreation is enabled
        Given a valid Polaris auth provider config with AllowUserCreation set to true
        When I send a POST request for Polaris login
        Then the system should create or update the user and return a hashId for Polaris login

    Scenario: Handle user login when AllowUserCreation is disabled
        Given a valid Polaris auth provider config with AllowUserCreation set to false
        When I send a POST request for Polaris login
        Then the system should process the request without creating or updating the user and return the validated user response for Polaris