module.exports = {
    addAuthProvider: {
        query: `mutation addAuthProvider($addAuthProviderInput: AuthProviderInput) {
             addAuthProvider(addAuthProviderInput: $addAuthProviderInput) {
             IsActive
             InternalLoginConfig {
            PasswordLabel
            UsernameLabel
             }
            }
        }`,
    },
    variables: {
        "addAuthProviderInput": {
            "CustomerID": "",
            "ProviderName": "",
            "OrgID": "test",
            "TokenExpiry": 30,
            "DisplayOnPortal": false
        }
    },
    AddAuthProvider: {
        "operationName":"AddAuthProvider",
        query: `mutation AddAuthProvider($addAuthProviderInput: AuthProviderInput) {
          addAuthProvider(addAuthProviderInput: $addAuthProviderInput) {
            _id
            ProviderName
            CustomerID
            IsActive
          }
        }`,
        variables: {
            "addAuthProviderInput": {
              "TokenExpiry": 24,
              "ProviderName": "externalCardValidation User - Login Disabled",
              "OrgID": "test",
              "Mappings": {
                "Username": "",
                "PrimaryEmail": "",
                "Mobile": "",
                "LastName": "",
                "GroupName": "",
                "FirstName": "",
                "CardNumber": "",
                "Account": ""
              },
              "LabelText": "externalCardValidation Developer 2 Login",
              "IsDeleted": false,
              "DefaultGroupID": "66102b267fdef3a741ce5d73",
              "CustomerID": "660da8f4d3390988e5edce04",
              "AuthProvider": "externalCardValidation",
              "IsActive": true,
              "ExternalCardValidationConfig": {
                "ClientId": "test",
                "ClientSecret": "test",
                "AuthorizationEndpoint": "http://localhost:3000/dev/graphql"
              },
              "AssociatedIdentityProvider": "",
              "IsActive": ""
            }
        }
    },
    addAuthProviderWithAdditionalParameters: {
      "operationName":"AddAuthProvider",
      query: `mutation AddAuthProvider($addAuthProviderInput: AuthProviderInput) {
        addAuthProvider(addAuthProviderInput: $addAuthProviderInput) {
          _id
          ProviderName
          CustomerID
        }
      }`,
      variables: {
        "addAuthProviderInput": {
          "AuthProvider": "oidc",
          "CustomerID": "",
          "DefaultGroupID": "",
          "IsActive": true,
          "IsDeleted": false,
          "ProviderName": "oidc Additional auth request Parameters",
          "OrgID": "test",
          "OpenIdConfig": {
            "ClientID": "test",
            "ClientSecret": "test",
            "MaxAge": 3600,
            "Prompt": "login",
            "AcrValues": "urn:okta:loa:2fa:any",
            "Display": "page"
          },
          "Mappings": {
            "Username": "user_name",
            "PrimaryEmail": "email",
            "FirstName": "given_name",
            "LastName": "family_name",
            "CardNumber": "card_number",
            "Mobile": "mobile_number",
            "GroupName": "group_name"
          }
        }
      }
    },
    UpdateAuthProvider: {
      "operationName":"UpdateAuthProvider",
      query: `mutation UpdateAuthProvider($authProviderId: ID!, $updateAuthProviderInput: AuthProviderInput, $customerId: ID) {
        updateAuthProvider(authProviderId: $authProviderId, updateAuthProviderInput: $updateAuthProviderInput, customerId: $customerId) {
          message
          statusCode
        }
      }`,
      variables: {
        "updateAuthProviderInput": {
          "OpenIdConfig": {
            "MaxAge": 3600,
            "Prompt": "login",
            "AcrValues": "urn:okta:loa:2fa:any",
            "Display": "page"
          },
          "DefaultGroupID": "",
          "AuthProvider": "oidc",
          "TokenExpiry": 24,
          "ProviderName": "oidc Additional auth request Parameters",
          "CustomerID": "",
          "IsActive": true,
          "DisplayOnPortal": true,
          "Mappings": {
            "Username": "user_name",
            "PrimaryEmail": "email",
            "FirstName": "given_name",
            "LastName": "family_name",
            "CardNumber": "card_number",
            "Mobile": "mobile_number",
            "GroupName": "group_name",
            "Account": ""
          },
          "OrgID": "test"
        },
        "customerId": "",
        "authProviderId": ""
      }
    }
}
