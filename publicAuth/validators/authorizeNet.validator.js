const ApiContracts = require('authorizenet').APIContracts;
const ApiControllers = require('authorizenet').APIControllers;

const { getObjectId: ObjectId } = require("../helpers/objectIdConvertion")
const { PAYMENT_TYPE: { AUTHORIZENET }, VALUE_ADDED_METHOD } = require('../helpers/constants')
const { getUtcTime, getUser, getDatabaseOneCustomer, getConfig,performDecryption, getPaymentStatsBySessionId } = require('../helpers/util')
const { setErrorResponse, setPaymentErrorResponse } = require('../services/api-handler')
const ERROR = require('../helpers/error-keys');
const CustomLogger = require('../helpers/customLogger');
const log = new CustomLogger()

module.exports.authorizeNetValidator = async(req, res, next) => {
  try {
    const { payload } = req.body;
    const customerId = req.params.id;
    const transactionId = payload.id

    const db = await getDatabaseOneCustomer({}, customerId)
    let config = await getConfig(db, customerId, AUTHORIZENET)
    if (!config) return await setPaymentErrorResponse(res, ERROR.CONFIG_NOT_FOUND)

    config = await performDecryption(config)

    const { transaction } = await getTransactionDetails(transactionId, config.AuthorizeNet);
    if (!transaction) return await setPaymentErrorResponse(res, ERROR.TRANSACTION_NOT_FOUND)

    const { customer, billTo, authAmount, responseCode, responseReasonDescription } = transaction
    const { id: sessionID, email } = customer
    const paymentStats = await getPaymentStatsBySessionId(db, sessionID, AUTHORIZENET, "initiated", res);

    const user = await getUser(db, customerId, paymentStats.UserID)
    if (!user) return await setPaymentErrorResponse(res, ERROR.WRONG_USER_ID)

    let firstName = billTo?.firstName ||  user.FirstName ||'';
    let lastName = billTo?.lastName || user.LastName|| '';

    let fullName = `${firstName} ${lastName}`;

    if (!fullName) fullName = null;

    let responseData = {
      TransactionID: transactionId,
      UserID: ObjectId.createFromHexString(user._id),
      CustomerID: ObjectId.createFromHexString(customerId),
      Username : user.Username,
      Name:fullName,
      Email: email,
      Amount: Number(authAmount),
      ResponseCode: responseCode.toString(),
      Status: responseCode === 1 ? 'succeeded' : 'failed',
      SellerMessage: responseReasonDescription,
      PaymentMethod: AUTHORIZENET,
      ValueAddedMethod: VALUE_ADDED_METHOD,
      City: billTo?.city,
      Country: billTo?.country,
      State: billTo?.state,
      TransactionStartTime: paymentStats.TransactionStartTime,
      TransactionEndTime: getUtcTime(),
      SessionID : sessionID
    }

    req.body.response = responseData 
    next()
  } catch (error) {
    log.error("authorizeNetValidator Error: ", error)
    return setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
  }
}

const getTransactionDetails = async (transactionId, authorizeNetConfig) => {
  try {
    const { TransactionKey, ApiLogin } = authorizeNetConfig
    const merchantAuthenticationType =
      new ApiContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(ApiLogin);
    merchantAuthenticationType.setTransactionKey(TransactionKey);

    const getRequest = new ApiContracts.GetTransactionDetailsRequest();
    getRequest.setMerchantAuthentication(merchantAuthenticationType);
    getRequest.setTransId(transactionId);

    const ctrl = new ApiControllers.GetTransactionDetailsController(getRequest.getJSON());
    const transactionRes = await new Promise((resolve, reject) => {
      ctrl.execute(async function () {
        const apiResponse = await ctrl.getResponse();
        const response = new ApiContracts.GetTransactionDetailsResponse(apiResponse);
        if (response != null) {
          if (response.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK) {
            resolve(response);
          } else {
            log.error("Error Code: " + response.getMessages().getMessage()[0].getCode());
            log.error("Error message: " + response.getMessages().getMessage()[0].getText());
            reject(response.getMessages().getMessage()[0].getText());
          }
        } else {
          log.error("Null response received");
        }
      });
    });
    return transactionRes;
  } catch (error) {
    log.error("getTransactionDetails Error: ", error);
    throw new Error(error);
  }
};