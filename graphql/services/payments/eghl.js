const crypto = require('crypto')
const { EGHL_PAGE_TIMEOUT } = require('../../helpers/constants')
const { basePath } = require('../../config/config')

const getHashKey = (argsData, encryptedData) => {
  const { CurrencyCode, Amount, ReturnURL, ApprovalURL, UnApprovalURL } = argsData
  const { ServiceId, Password } = encryptedData.eGHL

  const orderNumber = crypto.randomBytes(64).toString('hex').slice(0, 20)
  const password = Password
  const serviceID = ServiceId
  const paymentID = crypto
    .randomBytes(64)
    .toString('hex')
    .slice(0, 20)
    .toUpperCase()
  const merchantReturnURL = ReturnURL
  const merchantApprovalURL = ApprovalURL
  const merchantUnApprovalURL = UnApprovalURL
  const merchantCallBackURL = `${basePath}/eghl/response`
  const amount = parseFloat(Amount).toFixed(2)
  const currencyCode = CurrencyCode
  const custIP = ''
  const pageTimeout = EGHL_PAGE_TIMEOUT
  const cardNo = ''
  const token = ''
  const recurringCriteria = ''

  const hashKey = `${password}${serviceID}${paymentID}${merchantReturnURL}${merchantApprovalURL}${merchantUnApprovalURL}${merchantCallBackURL}${amount}${currencyCode}${custIP}${pageTimeout}${cardNo}${token}${recurringCriteria}`
  return {
    hashKey,
    orderNumber,
    paymentID,
    pageTimeout,
    amount,
    merchantCallBackURL,
    merchantReturnURL,
    merchantApprovalURL,
    merchantUnApprovalURL
  }
}

const getHash = (hashKey) => {
  let hash = crypto.createHash('sha256')
  data = hash.update(hashKey, 'utf8')
  let hashValue = data.digest('hex')
  return hashValue
}

const generateEghlHash = (argsData, encryptedData) => {
  const eghlData = getHashKey(argsData, encryptedData)
  const hash = getHash(eghlData.hashKey)
  return { hash, eghlData }
}

module.exports = generateEghlHash
