const typeDef = `#graphql
    type Area {
        _id: ID
        Label: String,
        Area: String
        Description: String,
        CustomerID: String,
        LocationID: String,
        GroupID: [String],
        RulesID: String,
        CustomizationID: String,
        Rule: RuleSchema,
        Tags: [String],
        CreatedBy: String,
        UpdatedBy: String,
        DeletedAt: Date,
        IsDeleted: Boolean,
        IsActive: Boolean,
        DeletedBy: String
    }
    
    input AreaInput {
        Label: String,
        Area: String!,
        Description: String,
        CustomerID: String!,
        LocationID: String!,
        GroupID: [String],
        RulesID: String,
        CustomizationID: String,
        Rule: RuleInput,
        Tags: [String],
        CreatedBy: String,
        UpdatedBy: String,
        DeletedAt: Date,
        IsDeleted: Boolean,
        DeletedBy: String
    }

    type AreasResponse {
        area: [Area],
        total: Int
    }
    
    extend type Mutation {
        addArea(addAreaInput: AreaInput): Area
        updateArea(updateAreaInput: AreaInput, areaId: ID!): Response
        areaDeleted(IsDeleted: Boolean, areaId: ID, customerId: ID): Response
        areaStatus(IsActive: Boolean, areaId: ID, customerId: ID): Response
    }
    
    extend type Query {
        getAreas(paginationInput: PaginationData, customerIds: [ID]): AreasResponse
        getArea(areaId: ID): Area
    }
`

module.exports = typeDef
