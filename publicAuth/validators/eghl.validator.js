const { getObjectId: ObjectId } = require("../helpers/objectIdConvertion")
const {
  getDatabaseOneCustomer,
  epochToUtc,
  getUtcTime,
  getUser,
} = require('../helpers/util')
const { PAYMENT_TYPE: { EGHL }, VALUE_ADDED_METHOD } = require('../helpers/constants')
const { setErrorResponse, setPaymentErrorResponse } = require('../services/api-handler')
const ERROR = require('../helpers/error-keys')

const validateAndExtractParams = async (input, properties, res) => {
  if (typeof input !== 'string' || input.trim() === '') {
    await setErrorResponse(null, ERROR.INVALID_INPUT_FIELD, res)
  }

  const pattern = new RegExp(
    `^${properties
      .map(
        (prop) =>
          `${prop.optional ? '(' : ''}${prop.name}:[\\w-]*${
            prop.optional ? ')?' : ''
          }`
      )
      .join('-')}$`
  )

  if (!pattern.test(input)) {
    await setErrorResponse(null, ERROR.INVALID_INPUT_FORMAT, res)
  }

  const paramArr = input.split('-')
  const result = {}

  properties.forEach((property, index) => {
    const [key, value] = paramArr[index].split(':')
    result[key] = value || (property.optional ? null : '')
  })

  return result
}

const param6Properties = [
  { name: 'C_ID' },
  { name: 'CO', optional: true },
  { name: 'D' },
]

const param7Properties = [{ name: 'U_ID' }, { name: 'city', optional: true }]

module.exports.eghlValidator = async (req, res, next) => {
  try {
    const {
      TxnID,
      Amount,
      CurrencyCode,
      TxnMessage,
      CardHolder,
      TxnStatus,
      Param6,
      Param7,
    } = req.body

    const param6Params = await validateAndExtractParams(Param6, param6Properties, res)
    const customerId = param6Params?.C_ID
    const country = param6Params?.CO
    const transactionTime = epochToUtc(param6Params?.D)

    const param7Params = await validateAndExtractParams(Param7, param7Properties, res)
    const userId = param7Params?.U_ID
    const city = param7Params?.city

    const db = await getDatabaseOneCustomer({}, customerId)
    const user = await getUser(db, customerId, userId)
    if (!user) return await setPaymentErrorResponse(res, ERROR.WRONG_USER_ID)
    const { Username } = user

    const responseData = {
      CustomerID: ObjectId.createFromHexString(customerId),
      UserID: ObjectId.createFromHexString(userId),
      TransactionID: TxnID,
      Name: CardHolder,
      Username,
      Email: user.PrimaryEmail ? user.PrimaryEmail : null,
      Amount: Number(Amount),
      City: city,
      Country: country,
      Currency: CurrencyCode,
      SellerMessage: TxnMessage,
      Status: TxnStatus === '0' ? 'succeeded' : 'failed',
      PaymentMethod: EGHL,
      ValueAddedMethod: VALUE_ADDED_METHOD,
      TransactionStartTime: getUtcTime(transactionTime),
      TransactionEndTime: getUtcTime()
    }

    req.body.response = responseData
    next()
  } catch (error) {
    console.log(error)
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
  }
}
