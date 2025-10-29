const typeDef = `#graphql
    type AccountSync {
        _id: ID,
        CustomerID: ID,
        CustomerName: String,
        ThirdPartySoftwareName: String,
        ThirdPartySoftwareType: ThirdPartySoftwareType,
        Tags: [String],
        APIEndpoint: String,
        ClientId: String,
        ClientSecret: String,
        Mappings: Mapping,
        IsDeleted: Boolean,
        CreatedBy: String,
        IsActive: Boolean
    }
    
    type Mapping {
        AccountID: String,
        AccountName: String,
        Description: String,
    }
    
    input MappingInput {
        AccountID: String!,
        AccountName: String,
        Description: String,
    }
    
    input AccountSyncInput {
        CustomerID: ID!,
        ThirdPartySoftwareName: String!,
        ThirdPartySoftwareType: ThirdPartySoftwareType!,
        Tags: [String],
        APIEndpoint: String!,
        ClientId: String!,
        ClientSecret: String!,
        Mappings: MappingInput,
        IsActive: Boolean
    }
    
    extend type Mutation {
        addAccountSync(addAccountSyncInput: AccountSyncInput): AccountSync
        updateAccountSync(updateAccountSyncInput: AccountSyncInput, customerId: ID!): Response
        deleteAccountSync(IsDeleted: Boolean, customerId: ID!): Response
        accountSyncStatus(IsActive: Boolean, customerId: ID!): Response
    }

    extend type Query {
        getAccountSync(customerId: ID!): AccountSync
    }
`;

module.exports = typeDef;
