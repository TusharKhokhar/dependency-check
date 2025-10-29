module.exports = {
  buildIdPMetadata: {
    "operationName":"BuildIdPMetadata",
    query: `query BuildIdPMetadata($customerId: ID, $authProviderId: ID) {
      buildIdPMetadata(customerId: $customerId, authProviderId: $authProviderId) {
        message
        statusCode
      }
    }`,
    variables: {
      customerId: "test",
      authProviderId: "test",
    },
  },
  getAuthProviders: {
    "operationName":"GetAuthProviders",
    query: `query GetAuthProviders($paginationInput: ProvidersPaginationData, $customerIds: [ID]) {
      getAuthProviders(paginationInput: $paginationInput, customerIds: $customerIds) {
        total
        authProvider {
          _id
          CustomerID
          ProviderName
          OrgID
          AuthProvider
          DefaultGroupID
          CustomerName
        }
      }
    }`,
    variables: {
      "paginationInput": {},
      "customerIds": "test"
    },
  },
  getAuthProvider: {
    "operationName":"GetAuthProvider",
    query: `query GetAuthProvider($customerId: ID, $authProviderId: ID) {
      getAuthProvider(customerId: $customerId, authProviderId: $authProviderId) {
        OpenIdConfig {
          MaxAge
          AcrValues
          Prompt
          Display
        }
      }
    }`,
    variables: {
      "customerId": "",
      "authProviderId": ""
    },
  },
  getAuthProviderWithIsDeletedTag : {
    "operationName":"GetAuthProvider",
    query: `query GetAuthProvider($customerId: ID, $authProviderId: ID) {
      getAuthProvider(customerId: $customerId, authProviderId: $authProviderId) {
        AuthProvider
        CallbackUrl
        CustomerID
        CustomerName
      }
    }`,
    variables: {
      "customerId": "",
      "authProviderId": ""
    },
  }
};
