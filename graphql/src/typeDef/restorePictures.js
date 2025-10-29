const typeDef = `#graphql
    type RestorePictures {
        _id: ID,
        CustomerID: ID,
        CustomerName: String,
        ThirdPartySoftwareName: String,
        ThirdPartySoftwareType: ThirdPartySoftwareType!,
        Tags: [String],
        RestoreExePath: String,
        IsActive: Boolean,
        CreatedBy: String,
        IsDeleted: Boolean,
    }

    input RestorePicturesInput {
        CustomerID: ID!,
        ThirdPartySoftwareName: String,
        ThirdPartySoftwareType: ThirdPartySoftwareType!,
        Tags: [String],
        RestoreExePath: String,
        IsActive: Boolean,
    }

    extend type Mutation {
        addRestorePictures(addRestorePicturesInput: RestorePicturesInput): RestorePictures
        updateRestorePictures(updateRestorePicturesInput: RestorePicturesInput, customerId: ID!): Response
        deleteRestorePictures(IsDeleted: Boolean, customerId: ID!): Response
        updateRestorePicturesStatus(IsActive: Boolean, customerId: ID!): Response
    }

    extend type Query {
        getRestorePictures(customerId: ID!): RestorePictures
    }
`;

module.exports = typeDef;
