const typeDef = `#graphql
    type Payment {
        _id: ID,
        CustomerID: String,
        PaymentType: String!,
        Description: String,
        Tags: [String],
        PaymentName: String,
        Enabled: String,
        Braintree: BraintreeSchema,
        Stripe: StripeSchema,
        iPay88: iPay88Schema,
        Paytm: PaytmSchema,
        PortOne: PortOneSchema,
        Heartland: HeartlandSchema,
        eGHL: eGHLSchema,
        Moneris: MonerisSchema,
        Xendit: XenditSchema,
        AuthorizeNet: AuthorizeNetSchema,
        CustomerData: CustomerDataSchema,
        CreatedBy: String,
        UpdatedBy: String,
        DeletedAt: Date,
        IsDeleted: Boolean,
        IsActive: Boolean,
        DeletedBy: String
    }
    
    input PaymentInput {
        CustomerID: String,
        PaymentType: String
        Description: String,
        Tags: [String],
        PaymentName: String,
        Enabled: String,
        Braintree: BraintreeInput,
        Stripe: StripeInput,
        iPay88: iPay88Input,
        Paytm: PaytmInput,
        Heartland: HeartlandInput,
        eGHL: eGHLInput,
        Moneris: MonerisInput,
        Xendit: XenditInput,
        AuthorizeNet: AuthorizeNetInput,
        PortOne: PortOneInput,
        CreatedBy: String,
        UpdatedBy: String,
        DeletedAt: Date,
        IsDeleted: Boolean,
        IsActive: Boolean,
        DeletedBy: String
    }

    type BraintreeSchema {
        MerchantId: String,
        PublicKey: String,
        PrivateKey: String,
    }

    input BraintreeInput {
        MerchantId: String,
        PublicKey: String,
        PrivateKey: String,
    }

    input BraintreeTokenInput {
        PaymentID: String,
        CustomerID: String
    }

    type BraintreeTokenResponse {
        StatusCode: Int,
        Message: String,
        Token: String
    }

    type StripeSchema {
        SecretKey: String,
        PublicKey: String,
        WebhookURL: String,
        WebhookSecret: String,
        WebhookID: String,
    }

    input StripeInput {
        SecretKey: String,
        PublicKey: String
        WebhookURL: String
    }

    type iPay88Schema {
        PaymentName: String,
        PaymentId: ID,
        MerchantCode: String,
        SecretKey: String,
        ProdDesc: String,
    }

    input iPay88Input {
        PaymentId: String,
        MerchantCode: String,
        SecretKey: String
        ProdDesc: String,
    }

    input pay88SignatureInput {
        CustomerID: String,
        PaymentID: ID,
        Amount: String
        Currency: String
    }

    type Pay88Response {
        Message: String
        StatusCode: Int
        RefNo: String
        Amount: String
        Currency: String
        MerchantCode: String
        PaymentId: String
        ProdDesc: String
        Lang: String,
        UserName: String,
        UserEmail: String,
        ResponseURL: String
        Signature: String
    }

    type PaytmSchema {
        PaymentName: String,
        QrCodeUrl: String,
        TransactionStatusUrl: String
    }

    input PaytmInput {
        PaymentName: String,
        QrCodeUrl: String,
        TransactionStatusUrl: String
    }

    type XenditSchema {
        SecretKey: String
        WebhookURL: String
    }

    input XenditInput {
        SecretKey: String
        WebhookURL: String
    }

    input XenditInvoiceInput {
        CustomerID: String,
        PaymentID: String,
        Amount: Float,
        Currency: String,
        SuccessURL: String,
        FailureURL: String
    }

    type XenditResponse {
        Message: String,
        StatusCode: Int,
        PayURL: String
    }

    type HeartlandSchema {
        MerchandID: String,
        SharedSecret: String
    }

    input HeartlandInput {
        MerchandID: String,
        SharedSecret: String
    }

    input HeartlandHashInput {
        CustomerID: String,
        PaymentID: String,
        Amount: Int,
        Currency: String,
    }

    type HeartlandResponse {
        Message: String,
        StatusCode: Int,
        Hash: String,
        Timestamp: String,
        OrderID: String,
        MerchantID: String,
        Currency: String,
        Amount: String
    }

    type eGHLSchema {
	    ServiceId: String,
	    Password: String
    }

    input eGHLInput {
	    ServiceId: String,
	    Password: String
    }

    input eGHLHashInput {
        CustomerID: String,
        PaymentID: String,
        CurrencyCode: String,
        Amount: Float,
        ReturnURL: String,
        ApprovalURL: String,
        UnApprovalURL: String
    }

    type eGHLHashResponse {
        ServiceID: String,
        Message: String,
        StatusCode: Int,
        OrderNumber: String,
        PaymentID: String,
        PageTimeout: String,
        Amount: String,
        CurrencyCode: String,
        Hash: String,
        CallbackURL: String,
        ReturnURL: String,
        ApprovalURL: String,
        UnApprovalURL: String
    }

    type MonerisSchema {
        StoreId: String,
        ApiToken: String,
        CheckoutId: String
    }

    input MonerisInput {
        StoreId: String,
        ApiToken: String,
        CheckoutId: String
    }

    input MonerisCheckoutInput {
        CustomerID: String,
        PaymentID: String,
        Price: Float,
        ProductName: String,
        Image: String
    }

    type MonerisResponse {
        Ticket: String,
        Message: String,
        StatusCode: Int
    }

    type AuthorizeNetSchema {
	    ApiLogin: String,
        TransactionKey: String,
        WebhookURL: String
    }

    input AuthorizeNetInput {
	    ApiLogin: String,
        TransactionKey: String,
        WebhookURL: String
    }

    input AuthorizeNetTokenInput {
	    ApiLogin: String,
        TransactionKey: String,
	    MerchantHash: String,
	    TestMode: Boolean,
        EnabledGateway: Boolean,
        CustomerID: String!,
        PaymentID: String,
        ProductName: String,
        Price: Int!,
        CancelUrl: String,
        SuccessUrl: String
    }

    type AuthorizeNetPaymentResponse {
        message: String
        statusCode: Int
        token: String
    }

    type PaymentsResponse {
        payment: [Payment],
        total: Int
    }

    input TransactionInput {
        PaymentMethodNonce: String,
        Amount: String
    }
    
    type StripeCheckoutResponse {
        message: String
        statusCode: String
    }
  
    input StripeCheckoutInput{
        CustomerID: String!
        PaymentID: String
        Price: Float
        ProductName: String
        Image: String
        Currency: String 
        SuccessUrl: String
        CancelUrl: String
    }
        
    type NayaxCheckoutResponse {
        Message: String
        StatusCode: Int
        TransactionID: String
    }
        
    type AtriumBalanceResponse {
        Message: String
        StatusCode: Int
        TransactionID: String
        RemainingAmount: Float
        Currency: String,
    }
  
    input NayaxCheckoutInput {
        CustomerID: String!
        Amount: Float
        Device: String
        TerminalID: String
    }

    input GetBalanceInput {
        PaymentType: ThingPaymentOption!
        CustomerId: ID!
        ThingID: ID!
        CardNumber: String!
    }

    type GetBalanceResponse {
        Message: String
        StatusCode: Int
        TransactionID: String
        RemainingAmount: String
        Currency: String,
    }

    input SendTransactionInput {
        PaymentType: ThingPaymentOption!
        ThingID: ID!
        CustomerId: String!
        Amount: Float
        Device: String
        Currency: String
        CardNumber: String!
    }
    
    type PortOneSchema {
        PublicKey: String,
        SecretKey: String,
        ApprovalURL: String,
        UnApprovalURL: String
        WebhookURL: String
    }

    input PortOneInput {
        PublicKey: String,
        SecretKey: String,
        ApprovalURL: String,
        UnApprovalURL: String
    }

    extend type Mutation {
        addPaymentConfiguration(addPaymentInput: PaymentInput): Payment
        updatePaymentConfiguration(updatePaymentInput: PaymentInput, paymentId: ID!, customerId: ID): Response
        paymentConfigurationDeleted(IsDeleted: Boolean, paymentId: ID, customerId: ID): Response
        paymentConfigurationStatus(IsActive: Boolean, paymentId: ID, customerId: ID): Response
        processPayment(customerId: ID, paymentId: ID, transactionInput: TransactionInput): Response
    }
    
    extend type Query {
        getPaymentConfigurations(paginationInput: PaginationData, customerIds: [ID]): PaymentsResponse
        getPaymentConfiguration(customerId: ID, paymentId: ID): Payment
        getBrainTreeClientToken(braintreeTokenInput: BraintreeTokenInput): BraintreeTokenResponse
        getStripeRedirectUrl(stripeInput: StripeCheckoutInput): StripeCheckoutResponse
        getAuthorizeNetClientToken(authorizeNetInput: AuthorizeNetTokenInput): AuthorizeNetPaymentResponse
        getEghlHash(eGHLHashInput: eGHLHashInput): eGHLHashResponse
        getHeartlandHash(heartlandHashInput: HeartlandHashInput): HeartlandResponse
        getXenditInvoiceURL(xenditInvoiceInput: XenditInvoiceInput): XenditResponse
        getMonerisTicket(monerisCheckoutInput: MonerisCheckoutInput): MonerisResponse
        getNayaxCheckout(nayaxCheckoutInput: NayaxCheckoutInput): NayaxCheckoutResponse
        getAtriumBalance (customerId: ID, terminalId: ID, accountMode: String,
            accountNumber: String, cardNumber: String, atriumEndpoint: String): AtriumBalanceResponse
        sendAtriumTransaction (customerId: ID, cardNumber: String, 
            accountNumber: String, terminalId: String, currency: String, amount: Float, 
            accountMode: String, device: String, atriumEndpoint: String): Response
        getBalance(getBalanceInput: GetBalanceInput): GetBalanceResponse
        sendTransaction(sendTransactionInput: SendTransactionInput): Response
        getPay88Signature(pay88SignatureInput: pay88SignatureInput): Pay88Response
}
`;

module.exports = typeDef
