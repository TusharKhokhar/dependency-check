const typeDef = `#graphql
    scalar Date
    type License {
        _id: ID,
        CustomerID: String,
        CustomerData: CustomerDataSchema,
        CustomerEmail: String,
        RegisterDate: Date,
        RegisteredTo: Date,
        ThingsLimit: [ThingsLimit],
        DevicesLimit: [DevicesLimit],
        Copiers: [String],
        OrderNumber: String,
        Envisionware: Boolean,
        ItsMyPc: Boolean,
        EmailService: Boolean,
        FaxService: Boolean,
        Translation : Boolean,
        FaxLicenseOption: FaxServiceSchema,
        TranslationLicenseOption: TranslationServiceSchema,
        IsActive: Boolean,
        createdAt: String,
        CreatedBy: String,
        updatedAt: String,
        DeletedAt: Date,
        IsDeleted: Boolean,
        DeletedBy: String
    }

    type TranslationServiceSchema {
        Text: Boolean
        Audio: Boolean
    }

    type FaxServiceSchema {
        Local: Boolean
        International: Boolean
    }

    input TranslationServiceInput {
        Text: Boolean
        Audio: Boolean
    }

    input FaxServiceInput {
        Local: Boolean
        International: Boolean
    }
    
    input LicenseInput {
        CustomerID: String,
        CustomerEmail: String,
        RegisterDate: String,
        RegisteredTo: String,
        ThingsIDs: [String],
        ThingsLimit: [ThingsLimitInput],
        DevicesLimit: [DevicesLimitInput],
        Copiers: [String],
        OrderNumber: String,
        Envisionware: Boolean,
        ItsMyPc: Boolean,
        EmailService: Boolean,
        FaxService: Boolean,
        Translation : Boolean,
        FaxLicenseOption: FaxServiceInput,
        TranslationLicenseOption: TranslationServiceInput,
        IsActive: Boolean,
    }

    type ThingsLimit {
        ThingType: String,
        ThingNumber: Int,
    }

    input ThingsLimitInput {
        ThingType: String,
        ThingNumber: Int,
    }

    type DevicesLimit {
        DeviceType: String,
        DeviceNumber: Int,
    }

    input DevicesLimitInput {
        DeviceType: String,
        DeviceNumber: Int,
    }
    
    type LicensesResponse {
        license: [License],
        total: Int
    }

    type LicenseData { 
        RegisteredTo: Date, 
        RegisterDate: Date, 
        OrderNumber: String
    }

    extend type Mutation {
        "API to update license"
        updateLicense(updateLicenseInput: LicenseInput, licenseId: ID!): Response
        "API to delete license"
        licenseDeleted(IsDeleted: Boolean, licenseId: ID, customerId: ID): Response
        "API to make the license status as active or inactive"
        licenseStatus(IsActive: Boolean, licenseId: ID, customerId: ID): Response
    }
    
    extend type Query {
        "API to get licenses with pagination and customer id filter"
        getLicenses(paginationInput: PaginationData, customerIds: [ID]): LicensesResponse
        "API to get license by customer id"
        getLicense(customerId: ID): License
        "API to fetch license expiring soon"
        licenseExpiringCustomers (timezone: String, startDate: Date, endDate : Date, customerIds: [ID]): csvReportData
    }
`

module.exports = typeDef
