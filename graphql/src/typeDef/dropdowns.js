const typeDef = `#graphql
    type Dropdown {
        _id: ID,
        DeviceType: [String],
        ThingType: [String],
        PaperSize: [String],
        ThingTypeUpdateSupport: [String],
        TermsOfService: String,
        AuditLogsType: [AuditLogsTypeSchema],
        ThirdPartySoftwareType: [ThirdPartySoftwareType],
        FaxAreaCodes: FaxAreaCodesSchema
    }

    type AuditLogsTypeSchema {
        title: String
        value: String
    }

    type FaxAreaCodesSchema {
        AllowedUSCanadaAreaCodes: String
        AdditionalAreaCodes: String
        AllowedInternationalAreaCodes: String
    }

    extend type Query {
        getDropdowns(customerId: ID): Dropdown
    }`

module.exports = typeDef
