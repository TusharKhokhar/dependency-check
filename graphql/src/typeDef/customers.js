const typeDef = `#graphql

    type SubCustomerData {
        CustomerName: String,
        DisplayName: String,
        Description: String,
    }

    type MainCustomerData {
        CustomerName: String,
        DisplayName: String,
        Description: String,
    }

    type Customer {
        _id: ID
        Label: String,
        CustomerName: String,
        CustomerType: String,
        SubCustomer: [SubCustomerData]
        ParentCustomer: MainCustomerData
        ParentCustomerData: MainCustomerData,
        DisplayName: String,
        Description: String,
        Tags: [String],
        LicenseData: LicenseData,
        TimeZone: String,
        Partner: Boolean,
        CreatedBy: String,
        UpdatedBy: String,
        MfaEnforce: Boolean,
        DeletedAt: Date,
        IsDeleted: String,
        DeletedBy: String,
        createdAt: String,
        updatedAt: String,
        DomainName: String,
        Email: String,
        Tier: String,
        ApiKey: String,
        IsApproved: Boolean,
        ApprovedBy: String,
        IsActive: Boolean,
        Searchable: Boolean,
        LocationCount: Int
       }

    input CustomerInput {
        Label: String,
        CustomerName: String!,
        CustomerType: String,
        SubCustomerID: [String],
        ParentCustomer: String,
        SubCustomers: [String],
        DisplayName: String,
        Description: String,
        Tags: [String],
        TimeZone: String,
        Partner: Boolean,
        MfaEnforce: Boolean,
        DomainName: String,
        Email: String,
        Tier: String,
        ApiKey: String
    }
    
    input OnboardCustomer {
        CustomerData: CustomerInput,
        LicenseData: LicenseInput,
        CustomizationData: CustomizationInput,
        CustomizationTextData: customizationTextInput,
        UserData: OnboardUserInput,
        LocationData: LocationInput,
        JobListData: JobListInput,
        GroupData: GroupInput,
    }

    input approvedCustomer {
        IsApproved: Boolean
    }
    
    input PaginationData {
        pageNumber: Int,
        limit: Int,
        pattern: String,
        status: Boolean,
        sort: String,
        sortKey: String,
        deleted: Boolean,
        searchKey: String
        authProviderType: [AuthProviderOptions]
    }

    input SubCustomersPaginationData {
        pattern: String
    }

    type CustomersResponse {
        customer: [Customer],
        total: Int
    }

    type OnboardCustomerResponse {
        message: String,
        customerId: String
        statusCode: Int,
        customizationTextId: String
    }

    extend type Mutation {
        updateCustomer(updateCustomerInput: CustomerInput, CustomerID: ID!): Response
        approvedSignup(approvedSignupInput: approvedCustomer, CustomerID: ID): Response
        customerDeleted(IsDeleted: Boolean, customerId: ID): Response
        customerStatus(IsActive: Boolean, customerId: ID): Response
        onboardCustomer(OnboardCustomerInput: OnboardCustomer): OnboardCustomerResponse
    }
    
    extend type Query {
        getCustomers(paginationInput: PaginationData, customerIds: [ID], isPartner: Boolean): CustomersResponse
        getCustomer(customerId: ID): Customer
        getSubCustomers(paginationInput: PaginationData, customerId: ID): CustomersResponse
    }
`

module.exports = typeDef
