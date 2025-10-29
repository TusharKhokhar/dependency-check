# authProviders.feature
@authProviders

Feature: AuthProviders Management

  Scenario: Query to IdPMetaData
    Given a valid graphql query for buildIdPMetadata
    When user called the buildIdPMetadata query to check metaData
    Then response should contain valid attributes in metaData

  Scenario: add externalCardValidation type AuthProvider successfully
    Given the externalCardValidation type AuthProvider with valid input
    When the request is sent to addAuthProvider API
    Then the response should be successful

  Scenario: Missing AssociatedIdentityProvider when AuthProvider is externalCardValidation
    Given the AuthProvider is externalCardValidation without AssociatedIdentityProvider input
    When the request is sent to addAuthProvider API
    Then the response should return a message "Required fields are missing "

  Scenario: Invalid AssociatedIdentityProvider provided
    Given user adding externalCardValidation AuthProvider with AssociatedIdentityProvider as externalCardValidation authProvider
    When the request is sent to addAuthProvider API
    Then the response should return a message "Invalid associated identity provider"

  Scenario: Fetch AuthProviders providers with valid pagination
    Given get AuthProviders without pagination Input
    When the request is sent to getAuthProviders API
    Then I should receive all AuthProviders

  Scenario: Fetch AuthProviders providers with valid pagination
    Given get AuthProviders with pagination Input with page 1 and limit 2
    When the request is sent to getAuthProviders API
    Then I should receive 2 or less AuthProviders

  Scenario: Fetch AuthProviders providers with authProviderType
    Given get AuthProviders with authProviderType
    When the request is sent to getAuthProviders API
    Then I should receive only authProviderData mentioned in authProviderType

  Scenario: add new authProvider
    Given a valid graphql query for addAuthProvider
    When user called the addAuthProvider mutation to add new authProvider
    Then response should be status 200 for addAuthProvider

  Scenario: Add a new OIDC AuthProvider with additional parameters (Prompt, AcrValues, NonceEnabled, Display, MaxAge)
    Given a valid GraphQL mutation to add an AuthProvider with additional OIDC-specific parameters
    When the user invokes the addAuthProvider mutation
    Then response should be status 200 for addAuthProvider

  Scenario: Update an existing OIDC AuthProvider with additional parameters (Prompt, AcrValues, NonceEnabled, Display, MaxAge)
    Given a valid GraphQL mutation to update an existing AuthProvider with  additional OIDC-specific parameters
    When the user invokes the updateAuthProvider mutation
    Then the response should include the updated AuthProvider data

  Scenario: Fetch OIDC AuthProviders to verify additional parameters (Prompt, AcrValues, NonceEnabled, Display, MaxAge)
    Given a request to fetch AuthProviders filtered by type oidc
    When the getAuthProvider API is called
    Then the response should only contain AuthProvider data relevant to the OIDC type
    
  Scenario: Attempting to fetch a deleted AuthProvider
    Given the AuthProvider has been deleted
    When a request is made to the getAuthProvider API
    Then the response should return a message saying "AuthProvider not found"

  Scenario: Successfully add a new authProvider
    Given I have a valid authProvider input with isActive set to true
    When I send a request to add authProvider
    Then the response of authProvider should have status code 200
    And the response of authProvider should have isActive set to true

  Scenario: Add a new OIDC AuthProvider with Custom parameters
    Given a valid GraphQL mutation to add an AuthProvider with Custom parameters
    When the user invokes the addAuthProvider mutation
    Then response should be status 200 for addAuthProvider

  Scenario: Update an existing OIDC AuthProvider with Custom parameters
    Given a valid GraphQL mutation to update an existing AuthProvider with Custom parameters
    When the user invokes the updateAuthProvider mutation
    Then the response should include the updated AuthProvider data with Custom parameters

@wkp

  Scenario: add wkp type AuthProvider successfully
    Given the wkp type AuthProvider with valid input
    When the request is sent to wkp addAuthProvider API
    Then the response should be successful for wkp AuthProvider
