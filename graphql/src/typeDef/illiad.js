const typeDef = `#graphql
    type Illiad {
        _id: ID,
        CustomerID: ID,
        CustomerName: String,
        ThirdPartySoftwareName: String,
        ThirdPartySoftwareType: ThirdPartySoftwareType!,
        Tags: [String],
        Server: String,
        Path: String,
        Username: String,
        Password: String,
        IsActive: Boolean,
        CreatedBy: String,
        IsDeleted: Boolean,
    }

    input IlliadInput {
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
        addIlliad(addIlliadInput: IlliadInput): Illiad
        updateIlliad(updateIlliadInput: IlliadInput, customerId: ID!): Response
        deleteIlliad(IsDeleted: Boolean, customerId: ID!): Response
        updateIlliadStatus(IsActive: Boolean, customerId: ID!): Response
    }

    extend type Query {
        getIlliad(customerId: ID!): Illiad
    }
`;

module.exports = typeDef;
