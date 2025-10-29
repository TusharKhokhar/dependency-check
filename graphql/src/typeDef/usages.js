const typeDef = `#graphql
    type Balance {
         QuotaBalance: Int,
         DebitBalance: Int
       }
      
    input BalanceInput {
         QuotaBalance: Int,
         DebitBalance: Int
       } 

    type Booking {
         BookedBy: String,
         BookType: String,
         BookStartTime: Date,
         BookEndTime: Date,
         BookExtensions: Int,
         BookExtAmountBy: [String],
         BookExtAmount: Int,
         BookingType: String,
         BookingTypeBy: String,
         BookCancelled: Boolean,
         BookCancelledReason: String,
         BookCancelledBy: String
        }

    input BookingInput {
         BookedBy: String,
         BookType: String,
         BookStartTime: Date,
         BookEndTime: Date,
         BookExtensions: Int,
         BookExtAmountBy: [String],
         BookExtAmount: Int,
         BookingType: String,
         BookingTypeBy: String,
         BookCancelled: Boolean,
         BookCancelledReason: String,
         BookCancelledBy: String
        }
        
    type FinePayment {
         FinePayment: Boolean,
         FinePaymentby: String,
         FinePaymentFrom: String,
         InvoiceID: Int,
         PaymentGatewayProvider: String,
         PaymentGatewayTranID: Int,
         CreditCardType: String,
         CreditCardLast4digits: String,
         FinePaymentAmount: Int,
         FinePaymentMethod: String,
         ResponseCode: Int,
         ResponseStatus: String,
         ResponseDescription: String,
         LMSUpdated: Boolean,
         LMSResponse: String,
         createdAt: Date,
         createdBy: String,
         updatedAt: Date,
         updatedBy: String,
         deletedAt: String,
         IsDeleted: Boolean,
         deletedBy: String
        }
        
            
    input FinePaymentInput {
         FinePayment: Boolean,
         FinePaymentby: String,
         FinePaymentFrom: String,
         InvoiceID: Int,
         PaymentGatewayProvider: String,
         PaymentGatewayTranID: Int,
         CreditCardType: String,
         CreditCardLast4digits: String,
         FinePaymentAmount: Int,
         FinePaymentMethod: String,
         ResponseCode: Int,
         ResponseStatus: String,
         ResponseDescription: String,
         LMSUpdated: Boolean,
         LMSResponse: String
        }
    type Print {
         JobDeliveryMethod: String,
         PrintJobSubmitted: Date,
         Device: String,
         DeviceID: String,
         DocumentName: String,
         SystemFileName: String,
        TotalCost: Float,
        GrayscaleCost: Float,
        ColorCost: Float,
        TotalPages: Int,
         Orientation: String,
         GrayscalePages: Int,
         ColorPages: Int,
         Copies: Int,
         PaperSize: String,
         DocumentSize: Int,
         Duplex: Boolean,
         Staple: String,
         ColorType: String,
         JobPrinted: Boolean,
         JobPrintedBy: String,
         JobPrintedFrom: String,
         PrintCancelled: Boolean,
         ReasonCancelled: String,
         JobType: String,
         JobComment: String,
         ReleaseCode: String,
         PaymentType: String,
         PaymentCategory: PaymentCategories,
         PaymentBy: PaymentBySchema       
        }

    type PaymentBySchema {
        Account: Float,
        Cash: Float,
        CreditCard: Float,
        CBORD: Float
    }

    input PaymentByInput {
        Account: Float,
        Cash: Float,
        CreditCard: Float,
        CBORD: Float
    }
    
    enum PaymentCategories {
        quota
        real
        realtime
    }

    input PrintInput {
         JobDeliveryMethod: String,
         PrintJobSubmitted: Date,
         Device: String,
         DeviceID: String,
         DocumentName: String,
         SystemFileName: String,
         TotalCost: Float,
         GrayscaleCost: Float,
         ColorCost: Float,
         TotalPages: Int,
         GrayscalePages: Int,
         ColorPages: Int,
         Copies: Int,
         Orientation: String,
         PaperSize: String,
         DocumentSize: Int,
         Duplex: Boolean,
         ColorType: String,
         JobPrinted: Boolean,
         Staple: String,
         JobPrintedBy: String,
         JobPrintedFrom: String,
         PrintCancelled: Boolean,
         ReasonCancelled: String,
         JobType: String,
         JobComment: String,
         ReleaseCode: String,
         PaymentType: String,
         PaymentBy: PaymentByInput
        }

    type AddValue {
         ValueAdded: Boolean,
         ValueAddedBy: String
         ValueAddedByID: ID
         AccountID: ID,
         SelfAdded: Boolean,
         ThingID: ID,
         ThingName: String,
         ValueAddedMethod: String,
         ValueAddedFrom: String,
         AddValueAmount: Float,
         Comment: String,
         AddToBalance: String,
         StartingBalance: Float,
         UpdatedBalance: Float
        }
    
    input AddValueInput {
         ValueAdded: Boolean,
         ValueAddedBy: String,
         ValueAddedByID: ID
         SelfAdded: Boolean,
         ThingID: ID,
         ThingName: String,
         ValueAddedMethod: String,
         ValueAddedFrom: String,
         AddValueAmount: Float,
         AddToBalance: String
         StartingBalance: Float,
         UpdatedBalance: Float
        }

    type DeductValue {
        Deducted: Boolean,
        DeductedAmount: Float,
        DeductedMethod: String,
        JobType: String,
        AccountID: ID,
        AccountName: String
    }
    
    input DeductValueInput {
        Deducted: Boolean,
        DeductedAmount: Float,
        DeductedMethod: String,
        JobType: String,
        AccountID: ID,
        AccountName: String
    }

    enum reportType {
        print
        add_value
        deduct_balance
        copy
        scan
    }
    type Usage {
        _id: ID!
        Type: String,
        TransactionDate: Date,
        TransactionStartTime: Date,
        TransactionEndTime: Date,
        TransactionID: String,
        TimeZone: String,
        Customer: String,
        CustomerID: String,
        CurrencyCode: String
        Location: String,
        LocationID: String,
        Area: String,
        AreaID: String,
        Thing: String,
        ThingID: String,
        UserType: String,
        BarcodeNumber: String,
        FullName: String,
        EmailAddress: String,
        Balance: Balance,
        Group: String,
        GroupID: String,
        Booking: Booking,
        Print: Print,
        AddValue: AddValue,
        DeductBalance: [DeductBalanceSchema]
        DeductValue: DeductValue,
        FinePayment: FinePayment,
        Username: String,
        UserID: ID,
        ReleaseCode: String,
        Fax: FaxSchema,
        BillingAccountId: String,
        BillingAccountName: String,
        ThirdPartyTrackID: String,
        createdAt: Date,
        createdBy: String,
        updatedAt: Date,
        updatedBy: String,
        deletedAt: String,
        IsDeleted: Boolean,
        deletedBy: String
    }

    type DeductBalanceSchema {
        AccountName: String
        GroupID: ID
        AmountDeducted: Float
        Pages: Float
    }

    input UsageInput {
        Type: reportType,
        TransactionDate: Date,
        TransactionStartTime: Date,
        TransactionEndTime: Date,
        TransactionID: String,
        TimeZone: String,
        Customer: String,
        CustomerID: String,
        Location: String,
        LocationID: String,
        CurrencyCode: String
        Area: String,
        AreaID: String,
        Thing: String,
        ThingID: String,
        UserType: String,
        BarcodeNumber: String,
        FullName: String,
        EmailAddress: String,
        Balance: [BalanceInput],
        Group: String,
        GroupID: String,
        Booking: BookingInput,
        Print: PrintInput,
        AddValue: AddValueInput,
        DeductValue: DeductValueInput,
        DeductBalance: [ID]
        FinePayment: FinePaymentInput,
        Username: String,
        UserID: ID,
        ReleaseCode: String,
        Fax: FaxInputUsage,
        BillingAccountId: String,
        BillingAccountName: String,
    }

    type FaxSchema {
        JobDeliveryMethod : String,
		DocumentName : String,
		DocumentSize : Int,
		SentStatus : String,
		RemoteID : String,
		ErrorCode : String,
		Duration : String
    }

    input FaxInputUsage {
        JobDeliveryMethod : String,
		DocumentName : String,
		DocumentSize : Int,
		SentStatus : String,
		RemoteID : String,
		ErrorCode : String,
		Duration : String
    }
    
    type DayWiseData {
        date: String, 
        count: Int
    }
    
    type UserTotalJobs {
        Username: String,
        Jobs: Int
    }
    
    type UserTotalPages {
        Username: String,
        Page: Int
    }
    
     type DeliveryData {
        count: Int
    }

    type AccountInfoSchema {
        AccountName: String,
        Balance: Float,
        GroupID: ID
    }
    
    type DeliveryWiseData {
        web: [DeliveryData], 
        mobile: [DeliveryData],
        desktop: [DeliveryData],
        kiosk: [DeliveryData],
        email: [DeliveryData],
        driver: [DeliveryData]
    }
    
    
    type DeliveryByDateWiseData {
        web: [DayWiseData], 
        mobile: [DayWiseData],
        desktop: [DayWiseData],
        kiosk: [DayWiseData],
        email: [DayWiseData],
        driver: [DayWiseData]
    }
    
    
    type UserDashboardReports {
        DayWiseData: [DayWiseData],
        PrintJobs: UserTotalJobs,
        PrintPages: UserTotalPages,
        Balance: Float,
        AccountInfo: [AccountInfoSchema],
    }

    type DashboardReports {
     DayWiseData: [DayWiseData],
     DeliveryWiseData: DeliveryWiseData,
     DeliveryByDateWiseData: DeliveryByDateWiseData,
    }
    
    input Filters {
        customerId: [ID],
        locationId: [ID],
        startDate: String,
        endDate: String,
        submissionType: [String],
        transactionType: [String],
        colorType: [String],
        documentType: [String],
        timezone: String,
        orientation: [String],
        staple: Boolean,
        duplex: Boolean,
        paperSize: [String]
        valueAddedMethod: [String]
    }
    
    input FilterUsage {
        colorType: [String],
        documentType: [String],
        timezone: String,
        dateFrom: String,
        dateTo: String,
        userName: String,
        duplex: [Boolean],
        device: [String],
        printType: [String],
        documentName: [String],
        reportType: String,
        transactionBy: String,
        amount: Float,
        balanceAfter: Float,
        transactionType: [transactionTypes],
        valueAddedMethod: [String]
        isDeleted: Boolean
    }
    
    enum transactionTypes {
        credit_card
        cash
        system 
        account 
        override
        internal
    }

    type UsagesResponse {
        usage: [Usage],
        total: Int
    }

    type csvReportData {
        base64: String
    }

    extend type Mutation {
        addUsage(addUsageInput: UsageInput): Usage
    }
    
    extend type Query {
        getUsages(paginationInput: PaginationData, customerIds: [ID], filters: FilterUsage): UsagesResponse
        getUsage(usageId: ID, customerId: ID): Usage
        dashboard(timeZone: String): DashboardReports
        userPortalDashboard(timeZone: String): UserDashboardReports
        csvReport(filters: Filters, customerId: ID): csvReportData
    }
`

module.exports = typeDef
