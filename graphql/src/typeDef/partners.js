const typeDef = `#graphql
    type Partner {
        _id: ID,
        ApiKey: String,
        Secret: String,
        CustomerID: ID,
        IsActive: Boolean,
        IsDeleted: Boolean,
        CreatedAt: Date,
        Read: Boolean,
        Write: Boolean
    }

    input PartnerInput {
        CustomerID: ID,
        IsActive: Boolean,
        IsDeleted: Boolean,
        Read: Boolean,
        Write: Boolean
    }
    
    type PartnerRes {
        CustomerID: ID
        CustomerName: String
        Keys: [Keys]
    }
    
    type Keys {
        ApiKey: String,
        CreatedAt: Date
    }

    type PartnersResponse {
        partner: [PartnerRes],
        total: Int
    }

    type ApiKeyResponse {
        keys: [Partner],
        total: Int
    }

    extend type Mutation {
        addPartner(addPartnerInput: PartnerInput): Partner
        updatePartner(updatePartnerInput: PartnerInput, partnerId: ID!): Response
        partnerDeleted(IsDeleted: Boolean, partnerId: ID, customerId: ID): Response
        partnerStatus(IsActive: Boolean, partnerId: ID, customerId: ID): Response
    }

    extend type Query {
        getPartners(paginationInput: PaginationData, customerIds: [ID]): PartnersResponse
        getPartner(partnerId: ID, customerId: ID): Partner
        getPartnerById(paginationInput: PaginationData, customerId: ID): ApiKeyResponse
    }
`

module.exports = typeDef
