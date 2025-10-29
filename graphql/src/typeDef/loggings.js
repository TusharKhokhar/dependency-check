const typeDef = `#graphql
    type LoggingSchema {
        _id: ID,
        CreatedBy: String,
        createdAt: String,
        Action: String,
        IsDeleted: Boolean,
        IsActive: Boolean
    }
    
    input LoggingInput {
        UpdatedBy: String,
        createdAt: String,
        Action: String,
        IsDeleted: Boolean
    }
    
    type LoggingsResponse {
        logging: [LoggingSchema],
        total: Int
    }

    extend type Mutation {
        addLogging(addLoggingInput: LoggingInput): LoggingSchema
        updateLogging(updateLoggingInput: LoggingInput, loggingId: ID!): Response
        loggingDeleted(IsDeleted: Boolean, loggingId: ID): Response
        loggingStatus(IsActive: Boolean, loggingId: ID): Response
    }
    
    extend type Query {
        getLoggings(paginationInput: PaginationData): LoggingsResponse
        getLogging(loggingId: ID): LoggingSchema
    }
`

module.exports = typeDef
