const typeDef = `#graphql

    type Customization {
        _id: ID,
        Customization: String,
        Description: String,
        CustomerID: String,
        Tags: [String],
        Logo: String,
        themeCode: String,
        Hex50: String,
        Hex100: String,
        Hex200: String,
        Hex300: String,
        Hex400: String,
        Hex500: String,
        Hex600: String,
        Hex700: String,
        Hex800: String,
        Hex900: String,
        Rgb50: String,
        Rgb100: String,
        Rgb200: String,
        Rgb300: String,
        Rgb400: String,
        Rgb500: String,
        Rgb600: String,
        Rgb700: String,
        Rgb800: String,
        Rgb900: String,
        CreatedBy: String,
        UpdatedBy: String,
        DeletedAt: Date,
        IsDeleted: Boolean,
        IsActive: Boolean,
        DeletedBy: String
    }

    input CustomizationInput {
        Customization: String,
        Description: String,
        CustomerID: String,
        Tags: [String],
        Logo: String,
        themeCode: String!,
        DeletedAt: Date,
        IsDeleted: Boolean,
        DeletedBy: String
    }

    type UploadLogoSchema {
        logoType: String,
        customerId: ID,
        signedUrl: String,
        path: String,
        expiryTime: String
    }
    
    input LogoAttributes {
        customerId: ID!,
        contentType: String!,
        extension: String!,
        logoType: String!
    }

    type CustomizationsResponse {
        customization: [Customization],
        total: Int
    }

    extend type Mutation {
        updateCustomization(updateCustomizationInput: CustomizationInput, customerId: String): Customization
        customizationDeleted(IsDeleted: Boolean, customizationId: ID, customerId: ID): Response
        customizationStatus(IsActive: Boolean, customizationId: ID, customerId: ID): Response
    }

    extend type Query {
        getCustomization(customizationId: ID, customerId: ID): Customization
        uploadLogo(logoMetaData: LogoAttributes): UploadLogoSchema
    }
`

module.exports = typeDef
