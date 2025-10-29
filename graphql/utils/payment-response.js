const CustomLogger = require("../helpers/customLogger");
const { currencyCodeMap } = require("../helpers/util");
const log = new CustomLogger();

const findPaymentOption = (thingData, PaymentType) => {
  const paymentOption = thingData?.PaymentOptions?.find(
    (option) => option.PaymentOptionType === PaymentType
  );

  if (!paymentOption) {
    throw new Error(`No ${PaymentType} payment option found in thingData.`);
  }

  return paymentOption;
};

const formatBalanceResponse = (getBalance) => {
  const internalCurrency = getBalance?.amount?.currency;
  const mappedCurrency = currencyCodeMap[internalCurrency] || internalCurrency;
      
  if (getBalance?.message?.toLowerCase().includes("approved")) {
    return {
      Message: getBalance?.message?.toLowerCase().includes("approved")
        ? "Approved"
        : getBalance.message,
      StatusCode: 200,
      TransactionID: getBalance.txid,
      RemainingAmount: getBalance?.amount?.remaining,
      Currency: mappedCurrency,
    };
  } else {
    log.info("Transaction failed");
    return {
      Message: getBalance.message,
      StatusCode: 400,
    };
  }
};

module.exports = { findPaymentOption, formatBalanceResponse };
