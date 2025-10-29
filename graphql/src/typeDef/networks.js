const typeDef = `#graphql
    type Network {
        _id: ID,
        CustomerID: ID,
        CustomerName: String,
        ThirdPartySoftwareName: String,
        ThirdPartySoftwareType: ThirdPartySoftwareType,
        Tags: [String],
        Server: String,
        Path: String,
        Username: String,
        Password: String,
        IsDeleted: Boolean,
        CreatedBy: String,
        IsActive: Boolean
    }
    
    input NetworkInput {
        CustomerID: ID!,
        ThirdPartySoftwareName: String!,
        ThirdPartySoftwareType: ThirdPartySoftwareType!,
        Tags: [String],
        Server: String,
        Path: String,
        Username: String,
        Password: String,
        IsActive: Boolean
    }
    
    extend type Mutation {
        addNetwork(addNetworkInput: NetworkInput): Network
        updateNetwork(updateNetworkInput: NetworkInput, customerId: ID!): Response
        deleteNetwork(IsDeleted: Boolean, customerId: ID!): Response
        networkStatus(IsActive: Boolean, customerId: ID!): Response
    }

    extend type Query {
        getNetwork(customerId: ID!): Network
    }
`;

module.exports = typeDef;
