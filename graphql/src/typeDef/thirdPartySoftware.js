const typeDef = `#graphql

 type ThirdPartySoftware {
        _id: ID,
        CustomerID: ID,
        ThirdPartySoftwareName: String,
        ThirdPartySoftwareType: ThirdPartySoftwareType,
        Tags: [String],
        IsActive: Boolean,
        CustomerName: String
    }

    type ThirdPartySoftwareResponse {
        thirdPartySoftware: [ThirdPartySoftware],
        total: Int
    }

    extend type Query {
        getThirdPartySoftware(paginationInput: PaginationData, customerIds: [ID]): ThirdPartySoftwareResponse
    }
`;

module.exports = typeDef;
