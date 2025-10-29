const {
  getDatabaseOneCustomer,
  getCustomer,
  formObjectIds,
  addCreateTimeStamp,
  checkResExistsAndUpdateBySessionId,
} = require("../helpers/util");
const CustomLogger = require("../helpers/customLogger");
const { domainName } = require("../config/config");
const { TRANSACTION_FAILED } = require("../helpers/error-messages");
const log = new CustomLogger();

module.exports.iPay88Response = async (req, res) => {
  log.lambdaSetup(req, "iPay88Response", "iPay88.controller");
  try {
    let responseData = req.body.response;
    const SessionID = req.body.RefNo;
    responseData = { ...responseData, SessionID };
    responseData = formObjectIds(responseData);
    responseData = addCreateTimeStamp(responseData);

    const { CustomerID } = responseData;
    const db = await getDatabaseOneCustomer({}, CustomerID);
    const customer = await getCustomer(db, CustomerID, res);
    
    await checkResExistsAndUpdateBySessionId(
      db,
      SessionID,
      responseData,
      customer,
      res,
      req
    );
  } catch (error) {
    log.error(error);
    return res.redirect(`https://${customer?.DomainName}.${domainName}/add-value/payment-error?error=${TRANSACTION_FAILED}`)
  }
};
