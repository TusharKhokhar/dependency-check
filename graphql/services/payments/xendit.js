const crypto = require('crypto')
const { Xendit } = require('xendit-node')
const { getUtcTime } = require('../../helpers/util');
const { XENDIT_INVOICE_DURATION } = require('../../helpers/constants');
const CustomLogger = require('../../helpers/customLogger');
const log = new CustomLogger()

const generateXenditInvoice = async (encryptedData, user, inputData) => {
  try {
    const { Amount, Currency, SuccessURL, FailureURL } = inputData
    const { _id, Username, PrimaryEmail } = user
    const { SecretKey } = encryptedData.Xendit
    const xendit = new Xendit({ secretKey: SecretKey })
    const externalID = crypto.randomBytes(64).toString('hex').slice(0, 25)
    const { Invoice } = xendit;
    
    const invoiceReq = await Invoice.createInvoice({
      data: {
        externalId : externalID,
        amount: Amount,
        currency: Currency,
        description: "Add funds to ePRINTit account",
        successRedirectUrl: SuccessURL,
        failureRedirectUrl: FailureURL,
        invoiceDuration: XENDIT_INVOICE_DURATION,
        paymentMethods: ["CREDIT_CARD"],
        customer: {
          customerId: `${_id}`,
          ...(PrimaryEmail ? { email: PrimaryEmail } : {}),
          surname: getUtcTime(),
          givenNames: Username,
        },
      },
    });
    
    const { invoiceUrl } = invoiceReq
    return { invoice_url: invoiceUrl }
  } catch(e) {
    log.error("Error in generateXenditInvoice ===> ", e)
    throw new Error(e.message)
  }
}

module.exports = generateXenditInvoice
