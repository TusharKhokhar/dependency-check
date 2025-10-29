@RequireAuth @orgAuth
Feature: Validate User API

    This api will be used by Partners to validate from one of the Customer configured Identity Providers (No SSO) and will return this information:
    Username, FirstName, LastName, email, mobile, Group, CardNumber

    Scenario: Missing userName in request body
        Given a request body without userName
        When I send a POST request to validateUser
        Then The HTTP response status should be 400 and the response should contain "Username is required"

    Scenario: Missing identityProvider in request body
        Given a request body without identityProvider
        When I send a POST request to validateUser
        Then The HTTP response status should be 400 and the response should contain "Identity Provider is required"

    Scenario Outline: Validate user with different credentials and identity providers
        Given a request body with "<userName>" "<password>" "<identityProvider>"
        When I send a POST request to validateUser
        Then The response status should be <statusCode>
        And The response should contain "<expectedMessage>"

        Examples:
            | userName | password   | identityProvider | statusCode | expectedMessage                                                                              | comment                                                                            |
            | admin    | Test@123$  | internal         | 200        | Success                                                                                      | correct request body                                                               |
            | admin    | Test@123   | internal         | 400        | Please provide valid username or password                                                    | invalid password for internal provider                                             |
            | admin1   | Test@123$  | internal         | 400        | User not found                                                                               | invalid userName for internal provider                                             |
            | admin    | Test@123$  | saml             | 400        | Oops! It looks like the identity provider is not configured. Please set it up and try again. | when given identityProvider not configured by customer                             |
            | admin    | Vijay@123$ | oidc             | 400        | Oops! Given identity provider is not supported by this API                                   | when given identityProvider is configured by customer but not supported by our api |
            | admin    | 1234       | ldap             | 400        | Unable to find user details                                                                  | given userName is wrong                                                            |
            | test     | 1234       | ldap             | 400        | Username or Password is not correct                                                          | given password is wrong                                                            |
            | admin    | 1234       | sirsi            | 400        | Unable to connect to Sirsi                                                                   | given userName or password is wrong                                                |
            | test     | 1234       | sip2             | 400        | User not found                                                                               | given userName or password is wrong                                                |
            | 601001   | 6010       | sip2             | 200        | Success                                                                                      | correct request body                                                               |
            |          | 6010       | sip2             | 400        | Username is required                                                                         | when username is Missing in request body                                           |