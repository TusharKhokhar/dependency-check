@LdapLogin
Feature: Login with Ldap

    This API is used to login users with Ldap identity providers and will return a hash ID on successful login.

    Scenario: Invalid request body for ldap login
        Given a request body "<requestBody>" for ldap login
        When I send a POST request for ldap login
        Then The response status should be <status> for ldap login
        And The response should contain "<expectedMessage>" for ldap login

        Examples:
            | requestBody                          | status | expectedMessage                     |
            | without authId                       | 400    | Auth provider is not configured     |
            | without username or invalid username | 400    | Username or Password is not correct |
            | invalid password                     | 400    | Username or Password is not correct |

    Scenario: Incorrect connection details in authProvider configuration for ldap login
        Given an authProvider with invalid Host or Port for ldap login
        When I send a POST request for ldap login
        Then The response status should be 400 for ldap login
        And The response should contain one of the messages for ldap login
            | The connection was refused by the server. Please check configuration |
            | The connection attempt timed out. Please check configuration         |
            | DNS lookup failed for hostname. Please check configuration           |

    Scenario: Incorrect authProvider configuration for ldap login
        Given an authProvider "<configuration>" for ldap login
        When I send a POST request for ldap login
        Then The response status should be <status> for ldap login
        And The response should contain "<expectedMessage>" for ldap login
        And The error should stored in AuditLogs collection for ldap login

        Examples:
            | configuration               | status | expectedMessage                                                 |
            | with invalid BindDn         | 400    | Invalid bind credentials configured. Please check configuration |
            | with invalid BindCredential | 400    | Invalid bind credentials configured. Please check configuration |
            | with invalid LdapBase       | 400    | Invalid provider configuration                                 |
# | with LoginType BarcodeOnly and Invalid Username or Password | 400    | Username or Password is invalid. Please check the configuration |

    Scenario: Successful ldap login
        Given a request body "with valid credentials" for ldap login
        And an authProvider "with valid configuration" for ldap login
        When I send a POST request for ldap login
        Then The response status should be 200 for ldap login
        And The response should contain hashId for ldap login

    Scenario: User completes ldap SSO login
        Given one user already exists in the system - ldapLogin
        When the user log in using ldap SSO
        Then the system should update the ldap user information