const crypto = require("crypto");
const {
  PAYMENT_TYPE: { IPAY88 },
} = require("../../helpers/constants");
const { getUtcTime } = require("../../helpers/util");
const { getObjectId: ObjectId } = require("../../helpers/objectIdConverter");
const { domainName, apiKey } = require("../../config/config");

const  getSourceFromApiKey = (apiKeyValue) => {
  for (const [source, key] of Object.entries(apiKey)) {
    if (key === apiKeyValue) {
      return source;
    }
  }
  return '';
}

const generatePay88Signature = async (
  input,
  credentials,
  db,
  CustomerID,
  userData,
  clientApiKey
) => {
  let { Amount, Currency } = input;
  Currency = Currency.toUpperCase();
  const { iPay88 } = credentials;
  const source = getSourceFromApiKey(clientApiKey);
  const { PaymentId, MerchantCode, SecretKey, ProdDesc } =
    iPay88;

  const RefNo = crypto
    .randomBytes(64)
    .toString("hex")
    .slice(0, 20)
    .toUpperCase();

  const formattedAmount = Amount.replace(/\./g, "");

  const stringToHash =
    SecretKey + MerchantCode + RefNo + formattedAmount + Currency;

  const signature = crypto
    .createHmac("sha512", SecretKey)
    .update(stringToHash)
    .digest("hex")
    .toUpperCase();

  if (signature) {
    await db.collection("PaymentStats").insertOne({
      CustomerID: ObjectId.createFromHexString(CustomerID),
      SessionID: RefNo,
      TransactionStartTime: new Date(getUtcTime()),
      Status: "initiated",
      PaymentMethod: IPAY88,
      UserID: userData._id,
      Amount: Number(Amount),
      MerchantCode: MerchantCode,
      Currency: Currency,
      PaymentId: PaymentId,
      UserName: userData.Username,
      Name: `${userData.FirstName} ${userData.LastName}`,
      UserEmail: userData.PrimaryEmail,
      ProdDesc: ProdDesc,
      Source: source
    });
  }

  return {
    signature,
    pay88Data: {
      refNo: RefNo,
      amount: Amount,
      currency: Currency,
      merchantCode: MerchantCode,
      paymentId: PaymentId,
      responseUrl: `https://api.${domainName}/public/ipay88/response`,
      ProdDesc: ProdDesc
    },
  };
};

module.exports = generatePay88Signature;
