const typeDef = `#graphql
    type BillingService {
        _id: ID
        ServiceID: ID
        ServiceName: String
        CreatedAt: String
        IsDeleted: Boolean
    }

    type BillingServicesResponse {
        services: [BillingService]
        total: Int
    }

    extend type Query {
        getBillingServices(paginationInput: PaginationData): BillingServicesResponse
    }
`;

module.exports = typeDef;
