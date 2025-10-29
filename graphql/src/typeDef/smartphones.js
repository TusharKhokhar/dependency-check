const typeDef = `#graphql

type Smartphone {
    _id: ID,
    CustomerID: ID,
    CustomerName: String,
    ThirdPartySoftwareName: String,
    ThirdPartySoftwareType: ThirdPartySoftwareType
    Tags: [String],
    Pin: SmartphonePin,
    IsActive: Boolean,
    CreatedBy: String,
    IsDeleted: Boolean
}

input SmartphoneInput {
    CustomerID: ID,
    ThirdPartySoftwareName: String!,
    ThirdPartySoftwareType: ThirdPartySoftwareType!,
    Tags: [String],
    Pin: SmartphonePin,
    IsActive: Boolean
}

enum SmartphonePin {
    Required
    Disabled
    Optional
}

extend type Mutation {
    addSmartphone(addSmartphoneInput: SmartphoneInput): Smartphone
    updateSmartphone(updateSmartphoneInput: SmartphoneInput, customerId: ID!): Response
    smartphoneDeleted(IsDeleted: Boolean, customerId: ID!): Response
    smartphoneStatus(IsActive: Boolean, customerId: ID!): Response
}

extend type Query {
    getSmartphone(customerId: ID): Smartphone
}
`
module.exports = typeDef
