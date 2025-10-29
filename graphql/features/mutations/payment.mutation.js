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

  addPaymentConfiguration: {
    operationName: "AddPaymentConfiguration",
    query: `mutation AddPaymentConfiguration($addPaymentInput: PaymentInput) {
            addPaymentConfiguration(addPaymentInput: $addPaymentInput) {
              CustomerID
              _id
              PortOne {
                ApprovalURL
                PublicKey
                SecretKey
                UnApprovalURL
              }
            }
          }`,
    variables: {
      addPaymentInput: {
        PaymentName: "PortOne",
        PaymentType: "PortOne",
        PortOne: {
          ApprovalURL: "yes.com",
          PublicKey: "qwertyui",
          SecretKey: "oiuytr",
          UnApprovalURL: "no.com"
        },
        CustomerID: "633c4f831d56a2724c9b58d2"
      }
    }
  }
};
