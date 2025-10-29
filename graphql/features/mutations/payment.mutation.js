const config = require("../configs/config");

module.exports = {
  addPaymentConfiguration: {
    operationName: "AddPaymentConfiguration",
    query: `mutation AddPaymentConfiguration($addPaymentInput: PaymentInput) {
            addPaymentConfiguration(addPaymentInput: $addPaymentInput) {
            Heartland {
              MerchandID
              SharedSecret
            }
            IsActive
            PaymentType
      }
    }`,
    variables: {
      addPaymentInput: {
        IsActive: '',
        Heartland: {
          MerchandID: "12345678",
          SharedSecret: config.config.url,
        },
        CustomerID: "",
        PaymentName: "this is for test",
        PaymentType: "Heartland",
      },
    },
  },
};
