const typeDef = `#graphql
    type HandWriteRecognition {
        _id: ID,
        CustomerID: ID,
        CustomerName: String,
        ThirdPartySoftwareName: String,
        ThirdPartySoftwareType: ThirdPartySoftwareType!,
        Tags: [String],
        AttachOriginalDocument: Boolean
        ConfidenceThreshold: Int
        IsActive: Boolean,
        CreatedBy: String,
        IsDeleted: Boolean,
    }

    input HandWriteRecognitionInput {
        CustomerID: ID!,
        ThirdPartySoftwareName: String!,
        ThirdPartySoftwareType: ThirdPartySoftwareType!,
        Tags: [String],
        AttachOriginalDocument: Boolean,
        ConfidenceThreshold: Int,
        IsActive: Boolean,
    }

    extend type Mutation {
        addHandWriteRecognition(addHandWriteRecognitionInput: HandWriteRecognitionInput): HandWriteRecognition
        updateHandWriteRecognition(updateHandWriteRecognitionInput: HandWriteRecognitionInput, customerId: ID!): Response
        deleteHandWriteRecognition(IsDeleted: Boolean, customerId: ID!): Response
        updateHandWriteRecognitionStatus(IsActive: Boolean, customerId: ID!): Response
    }

    extend type Query {
        getHandWriteRecognition(customerId: ID!): HandWriteRecognition
    }
`;

module.exports = typeDef;
