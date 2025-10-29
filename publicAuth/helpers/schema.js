const Joi = require('joi')

const numberValidator = Joi.number().strict().required();
const idValidator = Joi.any().id().required()
const dateValidator = Joi.date().iso().required();
const stringValidator = Joi.string().trim().required();
const stringValidatorOpt = Joi.string().trim().allow(null).allow('').optional();

const braintreeWebhookSchema = {
  TransactionID: stringValidator,
  CustomerID: idValidator,
  UserID: idValidator,
  Username: stringValidator,
  Name: stringValidator,
  Email: stringValidatorOpt,
  Amount: numberValidator,
  Currency: stringValidator,
  Status: stringValidator,
  SellerMessage: stringValidator,
  City: stringValidatorOpt,
  Country: stringValidatorOpt,
  PaymentMethod: stringValidator,
  ValueAddedMethod: stringValidator,
  TransactionStartTime: dateValidator,
  TransactionEndTime: dateValidator,
};

const stripeWebhookSchema = {
  TransactionID: stringValidator,
  CustomerID: idValidator,
  Amount: numberValidator,
  Currency: stringValidator,
  City: stringValidatorOpt,
  Country: stringValidatorOpt,
  Email: stringValidatorOpt,
  Name: stringValidator,
  SellerMessage: stringValidator,
  Status: stringValidator,
  PaymentMethod: stringValidator,
  ValueAddedMethod: stringValidator,
  TransactionStartTime: dateValidator,
  TransactionEndTime: dateValidator,
  UserID: idValidator,
  Username: stringValidator,
};

const monerisWebhookSchema = {
  CustomerID: idValidator,
  UserID: idValidator,
  TransactionID: stringValidator,
  Name: stringValidator,
  Username: stringValidator,
  Email: stringValidatorOpt,
  Amount: numberValidator,
  City: stringValidatorOpt,
  Country: stringValidatorOpt,
  Status: stringValidator,
  PaymentMethod: stringValidator,
  ValueAddedMethod: stringValidator,
  TransactionStartTime: dateValidator,
  TransactionEndTime: dateValidator,
};

const xenditWebhookSchema = {
  UserID: idValidator,
  CustomerID: idValidator,
  TransactionID: stringValidator,
  Username: stringValidator,
  Email: stringValidatorOpt,
  Amount: numberValidator,
  Currency: stringValidator,
  Status: stringValidator,
  PaymentMethod: stringValidator,
  ValueAddedMethod: stringValidator,
  TransactionStartTime: dateValidator,
  TransactionEndTime: dateValidator,
};

const eghlWebhookSchema = {
  CustomerID: idValidator,
  UserID: idValidator,
  TransactionID: stringValidator,
  Name: stringValidator,
  Username: stringValidator,
  Email: stringValidatorOpt,
  Amount: numberValidator,
  City: stringValidatorOpt,
  Country: stringValidatorOpt,
  Currency: stringValidator,
  SellerMessage: stringValidator,
  Status: stringValidator,
  PaymentMethod: stringValidator,
  ValueAddedMethod: stringValidator,
  TransactionStartTime: dateValidator,
  TransactionEndTime: dateValidator,
};

const heartlandWebhookSchema = {
  UserID: idValidator,
  CustomerID: idValidator,
  TransactionID: stringValidator,
  Username: stringValidator,
  Name: stringValidator,
  Email: stringValidatorOpt,
  Amount: numberValidator,
  Currency: stringValidator,
  City: stringValidatorOpt,
  Country: stringValidatorOpt,
  SellerMessage: stringValidator,
  Status: stringValidator,
  PaymentMethod: stringValidator,
  ValueAddedMethod: stringValidator,
  TransactionStartTime: dateValidator,
  TransactionEndTime: dateValidator,
};

const authorizeWebhookSchema = {
  TransactionID: stringValidator,
  UserID: idValidator,
  CustomerID: idValidator,
  Username: stringValidator,
  Name: stringValidator,
  Email: stringValidatorOpt,
  Amount: numberValidator,
  ResponseCode: stringValidator,
  Status: stringValidator,
  SellerMessage: stringValidator,
  PaymentMethod: stringValidator,
  ValueAddedMethod: stringValidator,
  City: stringValidatorOpt,
  Country: stringValidatorOpt,
  State: stringValidatorOpt,
  TransactionStartTime: dateValidator,
  TransactionEndTime: dateValidator,
  SessionID : stringValidatorOpt
};

const nayaxWebhookSchema = {
  TransactionID: stringValidator,
  UserID: idValidator,
  CustomerID: idValidator,
  Username: stringValidator,
  Email: stringValidatorOpt,
  Amount: numberValidator,
  Status: stringValidator,
  PaymentMethod: stringValidator,
  ValueAddedMethod: stringValidator,
  TransactionStartTime: dateValidator,
  TransactionEndTime: dateValidator,
  Device: stringValidator,
};

const ipay88WebhookSchema = {
  CustomerID: idValidator,
  Amount: numberValidator,
  AuthCode: stringValidatorOpt,
  TransactionID: stringValidator,
  Username: stringValidatorOpt,
  UserID: idValidator,
  PaymentMethod: stringValidator,
  Status: stringValidator,
  ErrDesc: stringValidatorOpt,
  ValueAddedMethod: stringValidator,
  Source: stringValidatorOpt,
  TransactionStartTime: dateValidator,
  TransactionEndTime: dateValidator
};

const gatewayWebhookSchema = {
  Stripe: stripeWebhookSchema,
  Braintree: braintreeWebhookSchema,
  AuthorizeNet: authorizeWebhookSchema,
  Moneris: monerisWebhookSchema,
  eGHL: eghlWebhookSchema,
  Heartland: heartlandWebhookSchema,
  Xendit: xenditWebhookSchema,
  Nayax: nayaxWebhookSchema,
  iPay88: ipay88WebhookSchema
}

module.exports = {
  braintreeWebhookSchema,
  stripeWebhookSchema,
  authorizeWebhookSchema,
  xenditWebhookSchema,
  monerisWebhookSchema,
  eghlWebhookSchema,
  heartlandWebhookSchema,
  gatewayWebhookSchema,
  nayaxWebhookSchema,
}