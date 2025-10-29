@SirsiLogin
Feature: Login with Sirsi

    This API is used to login users with sirsi identity providers and will return a hash ID on successful login.

    Scenario: Invalid request body for sirsi login
        Given a request body "<requestBody>" to login with sirsi
        When I send a POST request to login with sirsi
        Then The response status should be <status> in login with sirsi
        And The response should contain "<expectedMessage>" in login with sirsi

        Examples:
            | requestBody                      | status | expectedMessage                      |
            | without authId                   | 400    | Auth provider is not configured      |
            | without barcode or password      | 400    | The provided credentials are invalid |
            | with invalid barcode or password | 400    | The provided credentials are invalid |

    Scenario: Incorrect authProvider configuration for sirsi login
        Given an authProvider "<configuration>" to login with sirsi
        When I send a POST request to login with sirsi
        Then The response status should be <status> in login with sirsi
        And The response should contain "<expectedMessage>" in login with sirsi
        And The error should stored in AuditLogs collection for sirsi login

        Examples:
            | configuration                                               | status | expectedMessage                                                 |
            | with invalid ClientID                                       | 400    | ClientId is invalid. Please check the configuration             |
            | with LoginType BarcodeOnly and Invalid Username or Password | 400    | Username or Password is invalid. Please check the configuration |

    Scenario: Incorrect connection details in authProvider configuration for sirsi login
        Given an authProvider with invalid ServerBaseURL to login with sirsi
        When I send a POST request to login with sirsi
        Then The response status should be 400 in login with sirsi
        And The response should contain one of the messages in login with sirsi
            | The connection was refused by the server. Please check configuration |
            | The connection attempt timed out. Please check configuration         |
            | DNS lookup failed for hostname. Please check configuration           |

    Scenario: Successful sirsi login
        Given a request body "with valid credentials" to login with sirsi
        And an authProvider "with valid configuration" to login with sirsi
        When I send a POST request to login with sirsi
        Then The response status should be 200 in login with sirsi
        And The response should contain hashId in login with sirsi

    Scenario: Assign user to a group based on matched EasyBooking group rules in Sirsi login
        Given an EasyBooking group is created with specific matching conditions for Sirsi login
        When I send a POST request to login with sirsi
        Then The system should evaluate the EasyBooking group conditions and assign the user to the matching group based on the defined rules for Sirsi login

    Scenario: User completes Sirsi SSO login
     Given one user already exists in the system - SirsiLogin
     When the user log in using Sirsi SSO
     Then the system should update the Sirsi user information