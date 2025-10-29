@Sip2Login
Feature: Login with Sip2

    This API is used to login users with sip2 identity providers and will return a hash ID on successful login.

    Scenario: Missing authId in request body or Identity provider not configured by customer
        Given a request body without authId for SIP2 login
        When I send a POST request to login with sip2
        Then The HTTP response status should be 400 and the response should contain "Auth provider is not configured" in login with sip2

    Scenario: Missing barcode or pin in request body
        Given a request body without barcode or pin for SIP2 login
        When I send a POST request to login with sip2
        Then The HTTP response status should be 400 and the response should contain "Missing barcode or pin" in login with sip2

    Scenario: Unable to connect to SIP2 server
        Given an authProviderConfig with invalid connection details for SIP2 login
        When I send a POST request to login with sip2
        Then the response should have status 400 and contain any of the messages in login with sip2
            | The connection was refused by the server. Please check configuration |
            | The connection attempt timed out. Please check configuration         |
            | DNS lookup failed for hostname. Please check configuration           |

    Scenario: Unable to login to SIP2 server due to missing credentials when login is enabled
        Given an authProviderConfig with missing Username or Password for SIP2 login
        When I send a POST request to login with sip2
        Then The HTTP response status should be 400 and the response should contain "Configuration error: Username or Password is missing in sip2 configuration" in login with sip2

    Scenario: Unable to login to SIP2 server due to invalid credentials when login is enabled
        Given an authProviderConfig with invalid Username or Password for SIP2 login
        When I send a POST request to login with sip2
        Then The HTTP response status should be 400 and the response should contain "Unable to authenticate with the SIP2 server. Please check the configuration" in login with sip2
        And The error should stored in AuditLogs collection for sip2 login

    Scenario: Unable to Login to portal due to invalid barcode or pin
        Given a request body with invalid barcode or pin for SIP2 login
        When I send a POST request to login with sip2
        Then the response should have status 400 and contain any of the messages in login with sip2
            | User not found              |
            | Unable to find user details |

    Scenario: Able to Login to portal successfully
        Given a request body with valid credentials for SIP2 login
        When I send a POST request to login with sip2
        Then The HTTP response status should be 200 and the response should contain hashId in login with sip2

    Scenario: Assign user to a group based on matched GroupAssignmentRules in SIP2 login
        Given an authentication provider is configured with GroupAssignmentRules, and it contains a group named 'TBS Users' with specific matching conditions in SIP2 login
        When I send a POST request to login with sip2
        Then The user should be assigned to the "TBS Users" if rules matches for this group in SIP2 login
