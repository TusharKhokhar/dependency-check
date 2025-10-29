module.exports = {
  getBalance: {
    operationName: "GetBalance",
    query: `query GetBalance($getBalanceInput: GetBalanceInput) {
                getBalance(getBalanceInput: $getBalanceInput) {
                    Message
                    StatusCode
                    TransactionID
                    RemainingAmount
                    Currency
                }
        }`,
    variables: {
      getBalanceInput: {
        PaymentType: "",
        CustomerId: "",
        ThingID: "",
        CardNumber: "",
      },
    },
  },
  sendTransaction: {
    operationName: "SendTransaction",
    query: `query SendTransaction($sendTransactionInput: SendTransactionInput) {
                sendTransaction(sendTransactionInput: $sendTransactionInput) {
                    message
                    statusCode
                }
            }`,
    variables: {
      sendTransactionInput: {
        PaymentType: "",
        ThingID: "",
        CustomerId: "",
        Amount: 1,
        Device: "test",
        Currency: "USD",
        CardNumber: "",
      },
    },
  },
  
  GetPay88: {
    operationName: "GetPay88Signature",
    query: `query GetPay88Signature($pay88SignatureInput: pay88SignatureInput) {
            getPay88Signature(pay88SignatureInput: $pay88SignatureInput) {
              Message
              StatusCode
              RefNo
              Amount
              Currency
              MerchantCode
              ResponseURL
              Signature
              ApprovalURL
              UnApprovalURL
              PaymentId
              BackendURL
            }
        }`,
    variables: {
      pay88SignatureInput: {
        CustomerID: "",
        PaymentID: "",
        Amount: "",
        Currency: "",
        ApprovalURL: "https://test.org/add-value/payment-success",
        UnApprovalURL: "https://test.org/add-value/payment-error",
      },
    },
  },
};
