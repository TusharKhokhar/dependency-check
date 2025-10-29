const typeDef = `#graphql

enum ThirdPartySoftwareType {
    EmailIntegration
    SmartphoneIntegration
    NetworkIntegration
    FAX
    FTPIntegration
    FaxIntegration
    AudioIntegration
    RestorePicturesIntegration
    IlliadIntegration
    AbbyIntegration
    ProtonIntegration
    AccountSyncIntegration
    HandwriteRecognitionIntegration
    TextTranslationIntegration
}

type Proton {
    _id: ID,
    CustomerID: ID,
    CustomerName: String,
    ThirdPartySoftwareName: String,
    ThirdPartySoftwareType: ThirdPartySoftwareType,
    Tags: [String],
    OcpApimSubscriptionKey: String,
    TransactionOcpApimSubscriptionKey: String,
    ClientId: String,
    ClientSecret: String,
    TokenAPIEndpoint: String,
    TransactionServicesAPIEndpoint: String,
    IsActive: Boolean,
    CreatedBy: String,
    IsDeleted: Boolean
}

input ProtonInput {
    CustomerID: ID!,
    ThirdPartySoftwareName: String!,
    ThirdPartySoftwareType: ThirdPartySoftwareType!,
    Tags: [String],
    OcpApimSubscriptionKey: String,
    TransactionOcpApimSubscriptionKey: String,
    ClientId: String,
    ClientSecret: String,
    TokenAPIEndpoint: String,
    TransactionServicesAPIEndpoint: String,
    IsActive: Boolean
}

extend type Mutation {
    addProton(addProtonInput: ProtonInput): Proton
    updateProton(updateProtonInput: ProtonInput, customerId: ID!): Response
    protonDeleted(IsDeleted: Boolean, customerId: ID!): Response
    protonStatus(IsActive: Boolean, customerId: ID!): Response
}

extend type Query {
    getProton(customerId: ID): Proton
}
`
module.exports = typeDef