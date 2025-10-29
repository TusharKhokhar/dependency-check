const typeDef = `#graphql
    enum ColorType {
        Color
        Grayscale
    }
    
    enum PaperSizeType {
        Letter
        Legal
        Ledger
        Tabloid
        A4
        A3
        AsSaved
    }

    enum LayoutType {
        Landscape
        Portrait
        AsSaved
    }

    enum DuplexTypes {
        OneSided,
        TwoSided
    }
    type Copies {
        Enabled: Boolean,
        Limit: Int
    }

    input CopiesInput {
        Enabled: Boolean,
        Limit: Int
    }

    type Color {
        Enabled: Boolean,
        Color: Boolean,
        Grayscale: Boolean
    }

    input ColorInput {
        Enabled: Boolean,
        Color: Boolean,
        Grayscale: Boolean
    }

    type Duplex {
        Enabled: Boolean,
        OneSided: Boolean,
        TwoSided: Boolean
    }

    input DuplexInput {
        Enabled: Boolean,
        OneSided: Boolean,
        TwoSided: Boolean
    }

    type Price {
        Color: Float
        Grayscale: Float,
        ColorDuplex: Float,
        GrayscaleDuplex: Float
    }

    input PriceInput {
        Color: Float
        Grayscale: Float,
        ColorDuplex: Float,
        GrayscaleDuplex: Float
    }


    type Letter {
        Enabled: Boolean,
        Price: Price
    }

    input LetterInput {
        Enabled: Boolean,
        Price: PriceInput
    }

    type AddPaperSize {
        Enabled: Boolean,
        PaperSizeName: String,
        Price: Price
    }

    input AddPaperSizeInput {
        Enabled: Boolean,
        PaperSizeName: String,
        Price: PriceInput
    }

    type Ledger {
        Enabled: Boolean,
        Price: Price
    }

    input LedgerInput {
        Enabled: Boolean,
        Price: PriceInput
    }

    type Tabloid {
        Enabled: Boolean,
        Price: Price
    }

    input TabloidInput {
        Enabled: Boolean,
        Price: PriceInput
    }

    type Legal {
        Enabled: Boolean,
        Price: Price
    }

    input LegalInput {
        Enabled: Boolean,
        Price: PriceInput
    }

    type A4 {
        Enabled: Boolean,
        Price: Price
    }

    input A4Input {
        Enabled: Boolean,
        Price: PriceInput
    }

    type A3 {
        Enabled: Boolean,
        Price: Price
    }

    input A3Input {
        Enabled: Boolean,
        Price: PriceInput
    }



    type PaperSize {
        Enabled: Boolean,
        AsSaved: Boolean,
        Letter: Letter,
        Ledger: Ledger,
        Tabloid: Tabloid,
        Legal: Legal,
        A4: A4,
        A3: A3,
        AdditionalPaperSize: [AddPaperSize]
    }

    input PaperSizeInput {
        Enabled: Boolean,
        AsSaved: Boolean,
        Letter: LetterInput,
        Ledger: LedgerInput,
        Tabloid: TabloidInput,
        Legal: LegalInput,
        A4: A4Input,
        A3: A3Input,
        AdditionalPaperSize: [AddPaperSizeInput]
    }

    type Orientation {
        Enabled: Boolean,
        AsSaved: Boolean,
        Portrait: Boolean,
        Landscape: Boolean
    }

    input OrientationInput {
        Enabled: Boolean,
        AsSaved: Boolean,
        Portrait: Boolean,
        Landscape: Boolean
    }

    type PageRange {
        Enabled: Boolean,
        Limit: Int
    }

    input PageRangeInput {
        Enabled: Boolean,
        Limit: Int
    }


    type JobList {
        _id: ID
        CustomerID: String,
        ThingID: String,
        Copies: Copies,
        Color: Color,
        DeleteJobAfterPrint: Boolean,
        Duplex: Duplex,
        PaperSize: PaperSize,
        Orientation: Orientation,
        PageRange: PageRange,
        DefaultValues: JobListDefaultValues,
        CreatedBy: String,
        UpdatedBy: String,
        DeletedAt: Date,
        IsDeleted: Boolean,
        IsActive: Boolean,
        DeletedBy: String,
        AutomaticPrintDelivery: Boolean,
        ChargeForUsage: Boolean,
        QrCodeEnabled: Boolean,
        DefaultAutomaticDeliveryLocation: ID,
        LmsValidate: Boolean,
        DefaultLmsValidateThing: ID,
        ApiKey: String,
        Secret: String,
        URL: String,
        FileRetainPeriod: Int,
        CopyPaperSize: PaperSize,
        ScanPaperSize: PaperSize,
        CopyEnabled: Boolean,
        ScanEnabled: Boolean,
        LocationData: LocationDataSchema,
        ThingData: ThingDataSchema,
        Staple: StapleDataSchema,
        IppSettings: IppSettingsSchema
    }

    type IppSettingsSchema {
        AllowedCIDRorIPs: [String]
    }

    input IppSettingsInput {
        AllowedCIDRorIPs: [String]
    }

    input JobListInput {
        CustomerID: String,
        ThingID: String,
        Copies: CopiesInput,
        Color: ColorInput,
        Duplex: DuplexInput,
        DeleteJobAfterPrint: Boolean,
        PaperSize: PaperSizeInput,
        Orientation: OrientationInput,
        PageRange: PageRangeInput,
        DefaultValues: JobListDefaultValuesInput,
        QrCodeEnabled: Boolean,
        CreatedBy: String,
        UpdatedBy: String,
        DeletedAt: Date,
        IsDeleted: Boolean,
        DeletedBy: String,
        AutomaticPrintDelivery: Boolean,
        DefaultAutomaticDeliveryLocation: ID,
        LmsValidate: Boolean,
        ChargeForUsage: Boolean,
        DefaultLmsValidateThing: ID,
        ApiKey: String,
        Secret: String,
        URL: String,
        CopyPaperSize: PaperSizeInput,
        ScanPaperSize: PaperSizeInput,
        CopyEnabled: Boolean,
        ScanEnabled: Boolean,
        FileRetainPeriod: Int,
        Staple: StapleDataInput,
        IppSettings: IppSettingsInput
    }

    type StapleDataSchema {
        Enable: Boolean,
        StapleBottomLeft: Boolean,
        StapleBottomRight: Boolean,
        StapleTopLeft: Boolean,
        StapleTopRight: Boolean,
        StapleOptionDefaultType: StapleOptionType
    }

    input StapleDataInput {
        Enable: Boolean,
        StapleBottomLeft: Boolean,
        StapleBottomRight: Boolean,
        StapleTopLeft: Boolean,
        StapleTopRight: Boolean,
        StapleOptionDefaultType: StapleOptionType
    }

    enum StapleOptionType {
        None
        StapleBottomLeft
        StapleBottomRight
        StapleTopLeft
        StapleTopRight
    }

    type JobListDefaultValues {
        Color: String,
        Duplex: Boolean,
        PaperSize: String,
        Copies: String,
        Orientation: String,
        PageRange: String,
        Staple: String
    }
    
    input JobListDefaultValuesInput {
        Color: ColorType,
        Duplex: Boolean,
        PaperSize: String,
        Copies: String,
        Orientation: LayoutType,
        PageRange: String,
        Staple: String
    }

    type JobListsResponse {
        jobList: [JobList],
        total: Int
    }

    extend type Mutation {
        updateJobList(updateJobListInput: JobListInput, jobListId: ID!): Response
        jobListDeleted(IsDeleted: Boolean, jobListId: ID, customerId: ID): Response
        jobListStatus(IsActive: Boolean, jobListId: ID, customerId: ID): Response
    }

    extend type Query {
        getJobLists(paginationInput: PaginationData, customerIds: [ID]): JobListsResponse
        getJobList(jobListId: ID, customerId: ID): JobList
        getJobListByCustomerID(customerId: ID): JobList
    }
`

module.exports = typeDef
