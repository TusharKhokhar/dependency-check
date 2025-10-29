const Joi = require('joi')

const stringValidator = Joi.string().trim().replace(/\s/g, '').required()
const urlValidator = Joi.string().uri().trim().replace(/\s/g, '').required()
const idValidator = Joi.string().hex().required()
const idValidatorOpt = Joi.string().allow('').allow(null).hex()
const numberValidator = Joi.number().min(0).required()
const stringOpt = Joi.string().allow('').allow(null).trim().replace(/\s/g, '').optional()
const arrayValidatorOpt = Joi.array().items(stringOpt).allow(null)
const dateValidator = Joi.date().iso().allow(null)
const booleanValidator = Joi.boolean().allow(null)

const braintreeTransactionSchema = {
  CustomerID: idValidator,
  PaymentID: idValidator,
}

const stripeTransactionSchema = {
  CustomerID: idValidator,
  PaymentID: idValidator,
  ProductName: stringOpt,
  Image: stringOpt,
  Currency: stringValidator,
  Price: numberValidator,
  SuccessUrl: urlValidator,
  CancelUrl: urlValidator,
}

const authorizeTransactionSchema = {
  CustomerID: idValidator,
  PaymentID: idValidator,
  ProductName: stringOpt,
  Price: numberValidator,
  SuccessUrl: urlValidator,
  CancelUrl: urlValidator,
}

const eGHLTransactionSchema = {
  CustomerID: idValidator,
  PaymentID: idValidator,
  CurrencyCode: stringValidator,
  Amount: numberValidator,
  ReturnURL: urlValidator,
  ApprovalURL: urlValidator,
  UnApprovalURL: urlValidator,
}

const monerisTransactionSchema = {
  CustomerID: idValidator,
  PaymentID: idValidator,
  ProductName: stringOpt,
  Image: stringOpt,
  Price: numberValidator,
}

const xenditTransactionSchema = {
  CustomerID: idValidator,
  PaymentID: idValidator,
  Currency: stringValidator,
  Amount: numberValidator,
  SuccessURL: urlValidator,
  FailureURL: urlValidator,
}

const heartlandTransactionSchema = {
  CustomerID: idValidator,
  PaymentID: idValidator,
  Currency: stringValidator,
  Amount: numberValidator,
}

const nayaxTransactionSchema = {
  Amount: numberValidator,
  CustomerID: idValidator,
  Device: stringValidator,
  TerminalID: stringValidator,
}

const iPay88TransactionSchema = {
  CustomerID: idValidator,
  PaymentID: stringValidator,
  Amount: numberValidator,
  Currency: stringValidator,
};

const braintreeCredentialSchema = {
  PrivateKey: stringValidator,
  PublicKey: stringValidator,
  MerchantId: stringValidator,
}

const stripeCredentialSchema = {
  PublicKey: stringOpt,
  SecretKey: stringValidator,
}

const authorizeCredentialSchema = {
  TransactionKey: stringValidator,
  ApiLogin: stringValidator,
}

const eGHLCredentialSchema = {
  ServiceId: stringValidator,
  Password: stringValidator,
}

const heartlandCredentialSchema = {
  MerchandID: stringValidator,
  SharedSecret: stringValidator,
}

const xenditCredentialSchema = {
  SecretKey: stringValidator,
}

const monerisCredentialSchema = {
  ApiToken: stringValidator,
  StoreId: stringValidator,
  CheckoutId: stringValidator,
}

const PortOneSchema = {
  PublicKey: stringValidator,
  SecretKey: stringValidator,
  ApprovalURL: stringValidator,
  UnApprovalURL: stringValidator
}

const iPay88CredentialSchema = {
  PaymentId: stringValidator,
  MerchantCode: stringValidator,
  SecretKey: stringValidator,
  ProdDesc: stringValidator
};

const paymentGatewaySchema = {
  Braintree: braintreeCredentialSchema,
  Stripe: stripeCredentialSchema,
  AuthorizeNet: authorizeCredentialSchema,
  eGHL: eGHLCredentialSchema,
  Heartland: heartlandCredentialSchema,
  Xendit: xenditCredentialSchema,
  Moneris: monerisCredentialSchema,
  iPay88: iPay88CredentialSchema,
  PortOne: PortOneSchema,
}

const paymentSchema = Joi.object({
  CustomerID: idValidator,
  Description: stringOpt,
  Tags: arrayValidatorOpt,
  PaymentName: stringOpt,
  Enabled: stringOpt,
  CreatedBy: idValidatorOpt,
  UpdatedBy: idValidatorOpt,
  DeletedAt: dateValidator,
  IsDeleted: booleanValidator,
  IsActive: booleanValidator,
  DeletedBy: idValidatorOpt,
  PaymentType: Joi.string()
    .valid(...Object.keys(paymentGatewaySchema))
    .required(),
  ...Object.keys(paymentGatewaySchema).reduce(
    (acc, paymentType) => ({
      ...acc,
      [paymentType]: Joi.when('PaymentType', {
        is: paymentType,
        then: paymentGatewaySchema[paymentType],
        otherwise: Joi.object().forbidden(),
      }),
    }),
    {}
  ),
})

module.exports = {
  paymentGatewaySchema,
  authorizeTransactionSchema,
  stripeTransactionSchema,
  braintreeTransactionSchema,
  monerisTransactionSchema,
  eGHLTransactionSchema,
  heartlandTransactionSchema,
  xenditTransactionSchema,
  nayaxTransactionSchema,
  paymentSchema,
  iPay88TransactionSchema,
  PortOneSchema
}
