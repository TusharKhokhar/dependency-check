const ApiContracts = require('authorizenet').APIContracts
const ApiControllers = require('authorizenet').APIControllers
const { getUtcTime, getAuthorizeNetSessionId } = require('../../helpers/util');
const { AUTHORIZENET_PRODUCT_ID, DEFAULT_PRODUCT_NAME, PAYMENT_TYPE: { AUTHORIZENET } } = require('../../helpers/constants')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')

const getMerchantAuthentication = (ApiLogin, TransactionKey) => {
  const merchantAuthenticationType =
    new ApiContracts.MerchantAuthenticationType()
  merchantAuthenticationType.setName(ApiLogin)
  merchantAuthenticationType.setTransactionKey(TransactionKey)
  return merchantAuthenticationType
}

const getLineItems = (ProductName, Price) => {
  const lineItemType = new ApiContracts.LineItemType()
  lineItemType.setItemId(AUTHORIZENET_PRODUCT_ID)
  lineItemType.setName(ProductName && ProductName.length ? ProductName : DEFAULT_PRODUCT_NAME)
  lineItemType.setQuantity(1)
  lineItemType.setUnitPrice(Price)
  lineItemType.setTotalAmount(lineItemType.quantity * lineItemType.unitPrice)

  const lineItemList = []
  lineItemList.push(lineItemType)

  const arrayOfLineItems = new ApiContracts.ArrayOfLineItem()
  arrayOfLineItems.setLineItem(lineItemList)

  return arrayOfLineItems
}

const getUserFields = (CustomerID, User) => {
  const  { _id, Username } = User

  const userField1 = new ApiContracts.UserField()
  userField1.setName('CustomerID')
  userField1.setValue(CustomerID)

  const userField2 = new ApiContracts.UserField()
  userField2.setName('UserID')
  userField2.setValue(_id)

  const userField3 = new ApiContracts.UserField()
  userField3.setName('Username')
  userField3.setValue(Username)

  const userField4 = new ApiContracts.UserField();
  userField4.setName('TransactionStartTime');
  userField4.setValue(getUtcTime());

  const userFieldList = []
  userFieldList.push(userField1)
  userFieldList.push(userField2)
  userFieldList.push(userField3)
  userFieldList.push(userField4);

  const userFields = new ApiContracts.TransactionRequestType.UserFields()
  userFields.setUserField(userFieldList)

  return userFields
}

const getPaymentSettings = (SuccessUrl, CancelUrl) => {
  const setting1 = new ApiContracts.SettingType()
  setting1.setSettingName('hostedPaymentButtonOptions')
  setting1.setSettingValue('{"text": "Pay"}')

  const setting2 = new ApiContracts.SettingType()
  setting2.setSettingName('hostedPaymentOrderOptions')
  setting2.setSettingValue('{"show": false}')

  const setting3 = new ApiContracts.SettingType()
  setting3.setSettingName('hostedPaymentReturnOptions')
  setting3.setSettingValue(
    `{"showReceipt": false, "url": "${SuccessUrl}", "urlText": "Continue", "cancelUrl": "${CancelUrl}", "cancelUrlText": "Cancel"}`
  )

  const setting4 = new ApiContracts.SettingType()
  setting4.setSettingName('hostedPaymentCustomerOptions')
  setting4.setSettingValue(
    '{"showEmail": true, "requiredEmail": false, "addPaymentProfile": true}'
  )

  const settingList = []
  settingList.push(setting1)
  settingList.push(setting2)
  settingList.push(setting3)
  settingList.push(setting4)

  const settingsArray = new ApiContracts.ArrayOfSetting()
  settingsArray.setSetting(settingList)

  return settingsArray
}

const getHostedPaymentRequest = (
  merchantAuthenticationType,
  transactionRequestType,
  settingsArray
) => {
  const getRequest = new ApiContracts.GetHostedPaymentPageRequest()
  getRequest.setMerchantAuthentication(merchantAuthenticationType)
  getRequest.setTransactionRequest(transactionRequestType)
  getRequest.setHostedPaymentSettings(settingsArray)

  return getRequest
}

const getTransactionRequest = (lineItems, customerDataType, userFields) => {
  const transactionRequestType = new ApiContracts.TransactionRequestType()
  transactionRequestType.setTransactionType(
    ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
  )
  transactionRequestType.setLineItems(lineItems)
  const totalAmount = transactionRequestType.lineItems.lineItem[0].totalAmount
  transactionRequestType.setAmount(totalAmount)
  transactionRequestType.setCustomer(customerDataType)
  transactionRequestType.setUserFields(userFields)

  return transactionRequestType
}

const getCustomerDataType = (User, sessionID) => {
  const customerDataType = new ApiContracts.CustomerDataType()
  if (User.PrimaryEmail) {
    customerDataType.setEmail(User.PrimaryEmail);
  }
  customerDataType.setId(sessionID);
  return customerDataType
}

const getHostedPaymentResponse = async (getRequest) => {
  const ctrl = new ApiControllers.GetHostedPaymentPageController(
    getRequest.getJSON()
  )

  const response = await new Promise((resolve, reject) => {
    ctrl.execute(async function () {
      const apiResponse = await ctrl.getResponse()
      const response = new ApiContracts.GetHostedPaymentPageResponse(
        apiResponse
      )
      if (response != null) {
        if (
          response.getMessages().getResultCode() ==
          ApiContracts.MessageTypeEnum.OK
        ) {
          resolve(response)
        } else {
          console.log(
            'Error Code: ' + response.getMessages().getMessage()[0].getCode()
          )
          console.log(
            'Error message: ' + response.getMessages().getMessage()[0].getText()
          )
          reject(response.getMessages().getMessage()[0].getText())
        }
      } else {
        console.log('Null response received')
      }
    })
  })

  return response
}

const generateAuthorizeNetToken = async (
  ApiLogin,
  TransactionKey,
  ProductInfo,
  User,
  CustomerID,
  db
) => {
  const { ProductName, Price, CancelUrl, SuccessUrl } =
    ProductInfo

  try {
    const merchantAuthenticationType = getMerchantAuthentication(
      ApiLogin,
      TransactionKey
    )
    const sessionID = getAuthorizeNetSessionId()
    const customerDataType = getCustomerDataType(User, sessionID)
    const lineItems = getLineItems(
      ProductName,
      Price
    )
    const userFields = getUserFields(CustomerID, User)
    const transactionRequestType = getTransactionRequest(
      lineItems,
      customerDataType,
      userFields
    )
    const settingsArray = getPaymentSettings(SuccessUrl, CancelUrl)
    const getRequest = getHostedPaymentRequest(
      merchantAuthenticationType,
      transactionRequestType,
      settingsArray
    )
    const response = await getHostedPaymentResponse(getRequest)
    if (response && response.token) {
      await db.collection("PaymentStats").insertOne({
        CustomerID: ObjectId.createFromHexString(CustomerID),
        SessionID: sessionID,
        TransactionStartTime: new Date(getUtcTime()),
        Status: "initiated",
        PaymentMethod: AUTHORIZENET,
        UserID: User._id,
      });
    }
    return response
  } catch (e) {
    console.log(e)
    throw new Error(e)
  }
 
}

module.exports = generateAuthorizeNetToken
