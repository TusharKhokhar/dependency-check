const {
  PAYMENT_TYPE: { IPAY88 },
  VALUE_ADDED_METHOD,
} = require("../helpers/constants");
const { getUtcTime } = require("../helpers/util");
const { setErrorResponse } = require("../services/api-handler");
const ERROR = require("../helpers/error-keys");
const { getDb } = require("../config/db");
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger();

module.exports.iPay88Validator = async (req, res, next) => {
  try {
    const {
      MerchantCode,
      RefNo,
      TransId,
      Status,
      PaymentDate,
      ErrDesc,
      Remark,
      AuthCode,
    } = req.body;
    let db = await getDb();
    const paymentData = await db
      .collection("PaymentStats")
      .findOne({ SessionID: RefNo, MerchantCode });

    if (!paymentData) {
      log.error("Payment not found for RefNo:", RefNo);
      return await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res);
    }

    const { CustomerID, Amount, TransactionStartTime, Source } = paymentData;
    req.body.response = {
      CustomerID: CustomerID.toString(),
      Amount,
      AuthCode,
      TransactionID: TransId,
      Username: paymentData.UserName,
      UserID: paymentData?.UserID.toString(),
      PaymentMethod: IPAY88,
      Status: Status === "1" ? "succeeded" : "failed",
      ValueAddedMethod: VALUE_ADDED_METHOD,
      TransactionStartTime: getUtcTime(TransactionStartTime),
      TransactionEndTime: getUtcTime(),
      Source: Source,
      ErrDesc: ErrDesc
    };
    next();
  } catch (error) {
    console.log(error);
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res);
  }
};
