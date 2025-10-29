const typeDef = `#graphql
    type Account {
        _id: ID,
        CustomerID: ID,
        CustomerName: String,
        AccountId: String,
        AccountName: String,
        Description: String,
        Tags: [String],
        IsActive: Boolean,
        CreatedBy: String,
        IsDeleted: Boolean,
    }

    input AccountInput {
        CustomerID: ID!,
        AccountId: String!,
        AccountName: String,
        Description: String,
        Tags: [String],
        IsActive: Boolean,
    }

    type AccountsResponse {
        accounts: [Account],
        total: Int
    }

    extend type Mutation {
        addAccount(addAccountInput: AccountInput): Account
        updateAccount(updateAccountInput: AccountInput, accountId: ID!): Response
        deleteAccount(IsDeleted: Boolean, accountId: ID): Response
        updateAccountStatus(IsActive: Boolean, accountId: ID): Response
    }

    extend type Query {
        getAccounts(paginationInput: PaginationData, customerIds: [ID]): AccountsResponse
        getAccount(accountId: ID!): Account
        importAccount(customerId: ID): Response
    }
`;

module.exports = typeDef;
