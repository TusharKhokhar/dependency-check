const { GraphQLError } = require('graphql')
const {
  REQUIRED_ID_MISSING, REQUIRED_INPUT_MISSING, DISASSOCIATE_BEFORE_DELETION,
  PAYMENT_PROFILE_ALREADY_EXIST,
  INVALID_API_KEY
} = require('../../helpers/error-messages')
const { TOKEN_CREATED, HASH_CREATED, URL_GENERATED, TICKET_CREATED } = require('../../helpers/success-constants')
const dot = require('dot-object')
dot.keepArray = true
const { Payments, Users, AuthProviders} = require('../../models/collections')
const model = require('../../models/index')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, getDatabaseOneCustomer, getDatabaseForGetAllAPI,
  verifyUserAccess,
  performDecryption,
  performEncryption,
  validateInputs,
  validatePaymentFields,
  getConfig,
  getUser,
  addWebhookUrl,
  getUtcTime,
  verifyKioskAndUserAccess,
} = require('../../helpers/util')
const { customerSecurity } = require('../../utils/validation')
const {findReference} = require("../../helpers/referenceFinder");
const generateBraintreeToken = require("../../services/payments/brainTree");
const { generateStripeUrlFunction, createWebHookInStripe, deleteWebHookInStripe } = require('../../services/payments/stripe')
const generateAuthorizeNetToken = require('../../services/payments/authorizeNet')
const generateEghlHash = require('../../services/payments/eghl')
const generateHeartlandHash = require('../../services/payments/heartland')
const generateXenditInvoice = require('../../services/payments/xendit')
const generateMonerisTicket = require('../../services/payments/moneris')
const getNayaxResponse = require('../../services/payments/nayax')
const { 
  braintreeTransactionSchema,
  stripeTransactionSchema,
  authorizeTransactionSchema,
  eGHLTransactionSchema,
  monerisTransactionSchema,
  xenditTransactionSchema,
  heartlandTransactionSchema,
  nayaxTransactionSchema,
  paymentSchema,
  pay88TransactionSchema,
} = require('../../helpers/schema')
const { PAYMENT_TYPE: { NAYAX, STRIPE } } = require('../../helpers/constants')
const CustomLogger = require("../../helpers/customLogger");
const {atriumAuthToken, atriumGetBalance, atriumGetToken, atriumSendTransaction, getAtriumBalance, sendAtriumTransaction} = require("../../services/payments/atrium");
const config = require("../../config/config");
const { getCbordBalance, sendCboardTransaction } = require('../../services/payments/cbord');
const { getThingById } = require('../../models/things')
const { formatBalanceResponse, findPaymentOption } = require('../../utils/payment-response')
const { createPaymentStatus } = require('../../models/payment')
const generatePay88Signature = require('../../services/payments/pay88')
const log = new CustomLogger()

module.exports = {
  Mutation: {
    async addPaymentConfiguration(_, {addPaymentInput}, context, info) {
      log.lambdaSetup(context, 'payments', 'adaddPaymentConfigurationdUser')
      try {
      addPaymentInput = validatePaymentFields(addPaymentInput, paymentSchema)
      let {
        CustomerID,
        PaymentType,
        PaymentName,
        Description,
        Tags,
        Enabled,
        Braintree,
        Stripe,
        Pay88,
        Paytm,
        Heartland,
        eGHL,
        Moneris,
        Xendit,
        AuthorizeNet,
        IsActive,
        CreatedBy = ObjectId.createFromHexString(context.data._id),
      } = addPaymentInput
      let newPayment = {
        CustomerID: ObjectId.createFromHexString(CustomerID),
        PaymentType: PaymentType,
        Description: Description,
        Tags: Tags,
        Enabled: Enabled,
        Braintree: Braintree,
        Stripe: Stripe,
        Pay88: Pay88,
        Paytm: Paytm,
        Heartland: Heartland,
        eGHL: eGHL,
        Moneris: Moneris,
        Xendit: Xendit,
        AuthorizeNet: AuthorizeNet,
        IsDeleted: false,
        CreatedBy: CreatedBy,
        PaymentName: PaymentName,
        IsActive: IsActive
      }
        const db = await getDatabaseOneCustomer(context, CustomerID)
        verifyUserAccess(context, CustomerID)
        const paymentConfig = await db.collection(Payments).findOne({ PaymentType: PaymentType, CustomerID: ObjectId.createFromHexString(CustomerID), IsDeleted: false })
        if (paymentConfig) {
          throw new GraphQLError(PAYMENT_PROFILE_ALREADY_EXIST, {
            extensions: {
              code: '400'
            }
          })
        } else {
          if (PaymentType === STRIPE) {
            await createWebHookInStripe(newPayment);
          }
          newPayment = await performEncryption(newPayment)
          newPayment = formObjectIds(newPayment)
          newPayment = addCreateTimeStamp(newPayment)
          const {insertedId} = await db.collection(Payments).insertOne(newPayment)
          return await db.collection(Payments).findOne({_id: insertedId})
        }
      } catch (error) {
        log.error(error)
        if(error?.type === "StripeAuthenticationError"){
          throw new GraphQLError(INVALID_API_KEY, {
            extensions: {
              code: '400'
            }
          })
        }
        throw new Error(error)
      }
    },

    async updatePaymentConfiguration (_, { updatePaymentInput, customerId, paymentId }, context, info) {
      log.lambdaSetup(context, 'payments', 'addupdatePaymentConfigurationUser')
      try {
        verifyUserAccess(context, customerId)
        updatePaymentInput = await addUpdateTimeStamp(updatePaymentInput)
        const db = await getDatabaseOneCustomer(context, customerId)
        let currentPaymentSetting = await db.collection('Payments').findOne({_id: ObjectId.createFromHexString(paymentId)})
        updatePaymentInput.PaymentType = currentPaymentSetting.PaymentType
        // create new webhook in stripe if SecretKey or PublicKey updates. also delete existing webhook.
        if (updatePaymentInput.PaymentType === STRIPE) {
          currentPaymentSetting = await performDecryption(currentPaymentSetting);
          updatePaymentInput.Stripe.WebhookSecret = currentPaymentSetting.Stripe?.WebhookSecret || null
          if (
            currentPaymentSetting.Stripe?.WebhookID &&
            (updatePaymentInput.Stripe.SecretKey !== currentPaymentSetting.Stripe.SecretKey)
          ) {
            await createWebHookInStripe(updatePaymentInput);
            await deleteWebHookInStripe(currentPaymentSetting);
          }
          if (!currentPaymentSetting.Stripe?.WebhookID) {
            await createWebHookInStripe(updatePaymentInput);
          }
        }
        dot.remove('CustomerID', updatePaymentInput)
        updatePaymentInput = await performEncryption(updatePaymentInput)
        let updateObject = await dot.dot(updatePaymentInput)
        updatePaymentInput.UpdatedBy = ObjectId.createFromHexString(context.data._id)
        updateObject = await formObjectIds(updateObject, true)
        await db.collection(Payments).updateOne({ _id: ObjectId.createFromHexString(paymentId) }, {
          $set:
          updateObject
        })
        return {
          message: 'Updated successfully',
          statusCode: 200
        }
      } catch (e) {
        log.error(e);
        if(e?.type === "StripeAuthenticationError"){
          throw new GraphQLError(INVALID_API_KEY, {
            extensions: {
              code: '400'
            }
          })
        }
        throw new Error(e)
      }
    },

    async paymentConfigurationDeleted (_, { IsDeleted, paymentId, customerId }, context) {
      log.lambdaSetup(context, 'payments', 'paymentConfigurationDeleted')
      try {
        if (IsDeleted !== true) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '400'
            }
          })
        }
        if (!paymentId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '400'
            }
          })
        }
        verifyUserAccess(context, customerId)
        const db = await getDatabaseOneCustomer(context, customerId)
        const response = {
          message: 'Deleted Successfully',
          statusCode: 200
        }
        const errorSet = await findReference('payments', paymentId, db)
        if (errorSet.length > 0) {
          const newErrorSet = errorSet.join(', ')
          throw new GraphQLError(`${DISASSOCIATE_BEFORE_DELETION}${newErrorSet}`, {
            extensions: {
              code: '400'
            }
          })
        } else {
          let paymentInfo = await db.collection(Payments).findOne({_id: ObjectId.createFromHexString(paymentId)})
          if(paymentInfo.PaymentType === STRIPE && paymentInfo?.Stripe?.WebhookID){
            paymentInfo = await performDecryption(paymentInfo)
            await deleteWebHookInStripe(paymentInfo);
          }
          await db.collection(Payments).updateOne({_id: ObjectId.createFromHexString(paymentId)}, {
            $set: {
              IsDeleted: IsDeleted,
              DeletedBy: context.data._id,
              DeletedAt: new Date()
            }
          })
        }
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async paymentConfigurationStatus (_, { IsActive, paymentId, customerId }, context) {
      log.lambdaSetup(context, 'payments', 'paymentConfigurationStatus')
      try {
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '400'
            }
          })
        }
        if (!paymentId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '400'
            }
          })
        }
        verifyUserAccess(context, customerId)
        const response = {
          message: IsActive ? 'Deactivated Successfully' : 'Activated Successfully',
          statusCode: 200
        }
        const db = await getDatabaseOneCustomer(context, customerId)
        await db.collection(Payments).updateOne({ _id: ObjectId.createFromHexString(paymentId) }, { $set: { IsActive: IsActive } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    },
    async processPayment(_, {customerId, paymentId, transactionInput}, context) {
      log.lambdaSetup(context, 'payments', 'processPayment')
      try {
        verifyUserAccess(context, customerId);
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        let data = await db.collection(Payments).findOne({
          CustomerID: ObjectId.createFromHexString(customerId),
          _id: ObjectId.createFromHexString(paymentId)
        })
        if (data.Braintree) {
          return await processPayment(data, transactionInput)
        } else {
          throw new Error('Config not found')
        }
      } catch (err) {
        throw new Error(err)
      }
    }
  },

  Query: {
    async getPaymentConfigurations(_, {paginationInput, customerIds}, context) {
      log.lambdaSetup(context, 'payments', 'getPaymentConfigurations')
      let {
        pattern,
        pageNumber,
        limit,
        sort,
        status,
        sortKey
      } = paginationInput
      if (context.data?.CustomerID) {
        verifyUserAccess(context, context.data.CustomerID);
      }
      const customerId = context.data.customerIdsFilter
      const tenantDomain = context.data.TenantDomain
      pageNumber = pageNumber ? parseInt(pageNumber) : undefined
      limit = limit ? parseInt(limit) : undefined
      customerIds = customerIds || []
      const secureIds = await customerSecurity(tenantDomain, customerId, customerIds, context)
      if (secureIds) {
        customerIds = secureIds
      }
      const db = await getDatabaseForGetAllAPI(context, customerIds)
      const collection = db.collection(Payments)
      return await model.payment.getPaymentInformation(
        {
          status,
          pattern,
          sort,
          pageNumber,
          limit,
          sortKey,
          customerIds,
          collection
        }).then(paymentList => {
        const response = addWebhookUrl(paymentList)
        return response
      }).catch(err => {
        log.error(err)
        throw new Error(err)
      })
    },

    async getPaymentConfiguration (_, { customerId, paymentId}, context) {
      log.lambdaSetup(context, 'payments', 'getPaymentConfiguration')
      try {
        context.data.isKiosk ? verifyKioskAndUserAccess(context, customerId) : verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const paymentConfig =  await db.collection(Payments).findOne({ CustomerID: ObjectId.createFromHexString(customerId), _id: ObjectId.createFromHexString(paymentId) })
        const decryptedData = await performDecryption(paymentConfig)
        const response = addWebhookUrl(decryptedData)
        return response
      } catch (err) {
        log.error(err);
        throw new Error(err)
      }
    },

    async getBrainTreeClientToken(_, args, context) {
      log.lambdaSetup(context, 'payments', 'getBrainTreeClientToken')
      try {
        const { CustomerID, PaymentID } = validateInputs(args.braintreeTokenInput, braintreeTransactionSchema)
        if (CustomerID) {
          verifyUserAccess(context, CustomerID);
        }
        const db = CustomerID ? await getDatabaseOneCustomer(context, CustomerID) : await getDatabase(context)

        const data = await getConfig(db, PaymentID, CustomerID)
        await getUser(db, Users, CustomerID, context.data.user._id)

        const encryptedData = await performDecryption(data);
        const clientToken = await generateBraintreeToken(encryptedData)
        return { Message: TOKEN_CREATED, StatusCode: 200, Token: clientToken }
      } catch (err) {
        log.error(err);
        return { Message: err.message, StatusCode: 400 }
      }
    },

    async getStripeRedirectUrl(_, args, context) {
      log.lambdaSetup(context, 'payments', 'getStripeRedirectUrl')
      try {
        const stripeInputData = validateInputs(args.stripeInput, stripeTransactionSchema)
        const { CustomerID, PaymentID } = stripeInputData
        if (CustomerID) {
          verifyUserAccess(context, CustomerID);
        }
        const db = CustomerID ? await getDatabaseOneCustomer(context, CustomerID) : await getDatabase(context)

        const data = await getConfig(db, PaymentID, CustomerID)
        const user = await getUser(db, Users, CustomerID, context.data.user._id)

        const encryptedData = await performDecryption(data);
        const { url } = await generateStripeUrlFunction(encryptedData, stripeInputData, user)
	      return { message: url, statusCode: '200' }
      } catch (e) {
        log.error(e)
        return { message: e.message, statusCode: '400' }
      }
    },
 
    async getAuthorizeNetClientToken(_, args, context) {
      log.lambdaSetup(context, 'payments', 'getAuthorizeNetClientToken')
      try {
        const { CustomerID, PaymentID } = validateInputs(args.authorizeNetInput, authorizeTransactionSchema)
        if (CustomerID) {
          verifyUserAccess(context, CustomerID);
        }
        const db = CustomerID ? await getDatabaseOneCustomer(context, CustomerID) : await getDatabase(context)

        const data = await getConfig(db, PaymentID, CustomerID)
        const user = await getUser(db, Users, CustomerID, context.data.user._id)

        const encryptedData = await performDecryption(data)
        const { ApiLogin, TransactionKey } = encryptedData.AuthorizeNet
        const { token } = await generateAuthorizeNetToken(ApiLogin, TransactionKey, args.authorizeNetInput, user, data.CustomerID, db)
        return { message: TOKEN_CREATED, statusCode: '200', token: token }
      } catch(e) {
        log.error(e)
        return { message: e.message, statusCode: '400' }
      }
    },

    async getEghlHash(_, args, context) {
      log.lambdaSetup(context, 'payments', 'getEghlHash')
      try {
        const { CustomerID, PaymentID, CurrencyCode }  = validateInputs(args.eGHLHashInput, eGHLTransactionSchema)
        if (CustomerID) {
          verifyUserAccess(context, CustomerID);
        }
        const db = CustomerID ? await getDatabaseOneCustomer(context, CustomerID) : await getDatabase(context)

        const data = await getConfig(db, PaymentID, CustomerID)
        await getUser(db, Users, CustomerID, context.data.user._id)

        const encryptedData = await performDecryption(data)
        const { hash, eghlData } = generateEghlHash(args.eGHLHashInput, encryptedData)
          const {
          orderNumber,
          paymentID,
          pageTimeout,
          amount,
          merchantCallBackURL,
          merchantReturnURL,
          merchantApprovalURL,
          merchantUnApprovalURL
        } = eghlData

        return {
          Message: HASH_CREATED,
          StatusCode: 200,
          ServiceID: encryptedData.eGHL.ServiceId,
          PageTimeout: pageTimeout,
          Amount: amount,
          CurrencyCode,
          OrderNumber: orderNumber,
          PaymentID: paymentID,
          Hash: hash,
          ReturnURL: merchantReturnURL,
          CallbackURL: merchantCallBackURL,
          ApprovalURL: merchantApprovalURL,
          UnApprovalURL: merchantUnApprovalURL
        }
      } catch(e) {
        log.error(e)
        return { Message: e.message, StatusCode: 400 }
      }
    },
    
    async getHeartlandHash(_, args, context) {
      log.lambdaSetup(context, 'payments', 'getHeartlandHash')
      try {
        const { CustomerID, Amount, Currency, PaymentID } = validateInputs(args.heartlandHashInput, heartlandTransactionSchema)
        if (CustomerID) {
          verifyUserAccess(context, CustomerID);
        }
        const db = CustomerID ? await getDatabaseOneCustomer(context, CustomerID) : await getDatabase(context)

        const data = await getConfig(db, PaymentID, CustomerID)
        await getUser(db, Users, CustomerID, context.data.user._id)

        const paymentConfig = await performDecryption(data)
        const { timestamp, hash, orderID } = await generateHeartlandHash(paymentConfig, args.heartlandHashInput)
        return {
          Message: HASH_CREATED,
          StatusCode: 200,
          Timestamp: timestamp,
          OrderID: orderID,
          Hash: hash,
          Currency: Currency,
          MerchantID: paymentConfig.Heartland.MerchandID,
          Amount: Amount
        }
      } catch (err) {
        log.error(err)
        return { Message: err.message, StatusCode: 400 }
      }
    },

    async getXenditInvoiceURL(_, args, context) {
      log.lambdaSetup(context, 'payments', 'getXenditInvoiceURL')
      try {
        const { CustomerID, PaymentID } = validateInputs(args.xenditInvoiceInput, xenditTransactionSchema)
        if (CustomerID) {
          verifyUserAccess(context, CustomerID);
        }
        const db = CustomerID ? await getDatabaseOneCustomer(context, CustomerID) : await getDatabase(context)

        const data = await getConfig(db, PaymentID, CustomerID)
        const user = await getUser(db, Users, CustomerID, context.data.user._id)

        const encryptedData = await performDecryption(data)
        const { invoice_url } = await generateXenditInvoice(encryptedData, user, args.xenditInvoiceInput)
        return { Message: URL_GENERATED, StatusCode: 200, PayURL: invoice_url }
      } catch (err) {
        log.error(err)
        return { StatusCode: 400, Message: err.message, PayURL: null }
      }
    },

    async getMonerisTicket(_, args, context) {
      log.lambdaSetup(context, 'payments', 'getMonerisTicket')
      try {
        const { CustomerID, PaymentID } = validateInputs(args.monerisCheckoutInput, monerisTransactionSchema)
        if (CustomerID) {
          verifyUserAccess(context, CustomerID);
        }
        const db = CustomerID ? await getDatabaseOneCustomer(context, CustomerID) : await getDatabase(context)

        const data = await getConfig(db, PaymentID, CustomerID)
        const user = await getUser(db, Users, CustomerID, context.data.user._id)

        const encryptedData = await performDecryption(data)
        const result = await generateMonerisTicket(args.monerisCheckoutInput, encryptedData, user)
        return { Message: TICKET_CREATED, StatusCode: 200, Ticket: result.ticket }
      } catch (e) {
        log.error(e)
        return { Message: e.message, StatusCode: 400 }
      }
    },

    async getPay88Signature(_, args, context) {
      log.lambdaSetup(context, "payments", "getPay88Signature");
      try {
        const { CustomerID, PaymentID } = validateInputs(
          args.pay88SignatureInput,
          pay88TransactionSchema
        );

        if (CustomerID) {
          verifyUserAccess(context, CustomerID);
        }
        const db = CustomerID
          ? await getDatabaseOneCustomer(context, CustomerID)
          : await getDatabase(context);

        const data = await getConfig(db, PaymentID, CustomerID);
        const userData = await getUser(
          db,
          Users,
          CustomerID,
          context.data.user._id
        );

        const encryptedData = await performDecryption(data);
        const { signature, pay88Data } = await generatePay88Signature(
          args.pay88SignatureInput,
          encryptedData,
          db,
          CustomerID,
          userData
        );
        const {
          refNo,
          amount,
          currency,
          merchantCode,
          paymentId,
          responseUrl,
          ProdDesc
        } = pay88Data;

        return {
          Message: HASH_CREATED,
          StatusCode: 200,
          MerchantCode: merchantCode,
          PaymentId: paymentId,
          Currency: currency,
          RefNo: refNo,
          Amount: amount,
          UserName: userData.Username,
          UserEmail: userData.PrimaryEmail,
          Lang: "UTF-8",
          ProdDesc: ProdDesc,
          ResponseURL: responseUrl,
          Signature: signature,
        };
      } catch (e) {
        log.error(e);
        return { Message: e.message, StatusCode: 400 };
      }
    },

    async getNayaxCheckout(_, args, context) {
      log.lambdaSetup(context, 'payments', 'getNayaxCheckout')
      try {
        const inputData = args.nayaxCheckoutInput
        const { CustomerID, Device } = validateInputs(inputData, nayaxTransactionSchema)
        const db = CustomerID ? await getDatabaseOneCustomer(context, CustomerID) : await getDatabase(context)
        const tokenData = context.data
        const nayaxResponse = await getNayaxResponse(inputData)

        if (!nayaxResponse?.Status?.StatusMessage) {
          return { Message: 'Unable to connect with Nayax', StatusCode: 400, TransactionID: '' }
        }
        if (nayaxResponse.Status.Verdict === 'Approved') {
          await db.collection('PaymentStats').insertOne({
            CustomerID: ObjectId.createFromHexString(CustomerID),
            ThingID: ObjectId.createFromHexString(tokenData._id),
            TransactionID: nayaxResponse.TransactionId,
            ThingName: tokenData?.Thing,
            Amount: inputData.Amount,
            Status: "initiated",
            Device,
            PaymentMethod: NAYAX,
            TerminalID: inputData.TerminalID,
            TransactionStartTime: new Date(getUtcTime()),
          })
          return { Message: nayaxResponse.Status.StatusMessage, StatusCode: 200, TransactionID: nayaxResponse.TransactionId }
        }

        if (nayaxResponse.Status.Verdict === 'Declined') {
          return { Message: nayaxResponse.Status.ErrorDescription, StatusCode: 400, TransactionID: '' }
        }
        
        return { Message: 'Unexpected Verdict received', StatusCode: 500, TransactionID: '' };
      } catch (e) {
        log.error(e)
        return { Message: e.message, StatusCode: 400 }
      }
    },

    async getAtriumBalance (_, {customerId, terminalId, accountMode, accountNumber, cardNumber, atriumEndpoint }, context) {
      log.lambdaSetup(context, 'authProviders', 'getAtriumBalance')
      try {
        context.data.isKiosk  ? verifyKioskAndUserAccess(context, customerId) : verifyUserAccess(context, customerId)
        const authData = await atriumAuthToken(config.region)
        const token = await atriumGetToken(authData, atriumEndpoint)
        console.log('authData', authData)
        const getBalance = await atriumGetBalance(token, terminalId, accountMode, accountNumber, cardNumber, atriumEndpoint)
        if (getBalance?.message?.toLowerCase() === 'approved'){
          return {
            Message: getBalance.message,
            StatusCode: 200,
            TransactionID: getBalance.txid,
            RemainingAmount: getBalance?.amount?.remaining,
            Currency: getBalance?.amount?.currency
          }
        } else {
            log.info('transaction failed')
            return {
              Message: 'Failed to retrieve balance',
              StatusCode: 400
          }
        }
      } catch (err) {
        log.error(err)
        throw new Error(err.message)
      }
    },

    async sendAtriumTransaction (_, {customerId, cardNumber, accountNumber, terminalId,
      currency, amount, accountMode, device, atriumEndpoint }, context) {
      log.lambdaSetup(context, 'authProviders', 'sendAtriumTransaction')
      try {
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        context.data.isKiosk  ? verifyKioskAndUserAccess(context, customerId) : verifyUserAccess(context, customerId)
        const authData = await atriumAuthToken(config.region)
        const token = await atriumGetToken(authData, atriumEndpoint)
        const sendTransaction = await atriumSendTransaction(token, cardNumber, accountNumber,
          terminalId, currency, amount, accountMode, atriumEndpoint)
        if (sendTransaction?.message.toLowerCase() === 'approved') {
          console.log(sendTransaction);
          await db.collection('PaymentStats').insertOne({
            CustomerID: ObjectId.createFromHexString(customerId),
            TransactionID: sendTransaction.txid,
            Amount: amount.total,
            Status: sendTransaction.approved === 1 ? "success" : "failed",
            PaymentMethod: "Atrium",
            TerminalID: terminalId,
            TransactionStartTime: new Date(getUtcTime()),
            "Device" : device,
            "ThingID" : ObjectId.createFromHexString(context?.data?._id),
            "ValueAddedMethod" : "Credit Card",
            "IsActive" : true,
            "IsDeleted" : false,
          })
        } else {
          log.info('transaction failed')
        }
        return {
          message: `Transaction ${sendTransaction?.message}`,
          statusCode: 200
        }
      } catch (err) {
        log.error(err)
        throw new Error(err.message)
      }
    },
    
    async getBalance (_, { getBalanceInput }, context) {
      log.lambdaSetup(context, "authProviders", "getBalance");
      try {
        const { PaymentType, ThingID, CustomerId, CardNumber } =
          getBalanceInput;
        context.data.isKiosk
          ? verifyKioskAndUserAccess(context, CustomerId)
          : verifyUserAccess(context, CustomerId);
        const db = CustomerId
          ? await getDatabaseOneCustomer(context, CustomerId)
          : await getDatabase(context);

        const thingData = await getThingById({
          thingId: ThingID,
          projection: { PaymentOptions: 1 },
          db,
        });

        const paymentOption = findPaymentOption(thingData, PaymentType);

        let getBalance;
        switch (PaymentType) {
          case "Atrium":
            getBalance = await getAtriumBalance(paymentOption, CardNumber);
            break;
          case "CBORD":
            getBalance = await getCbordBalance(paymentOption, CardNumber);
            break;
          default:
            throw new Error(`Unsupported PaymentType: ${PaymentType}`);
        }
        log.info("getBalance ********", getBalance);
        return formatBalanceResponse(getBalance);
      } catch (err) {
        log.error("Error in getBalance *********:", err);
        throw new Error(err.message);
      }
    },

    async sendTransaction (_, { sendTransactionInput }, context) {      
      log.lambdaSetup(context, "authProviders", "sendTransaction");
      try {
        const {
          PaymentType,
          ThingID,
          CustomerId,
          Amount,
          Device,
          Currency,
          CardNumber,
        } = sendTransactionInput;
        context.data.isKiosk
          ? verifyKioskAndUserAccess(context, CustomerId)
          : verifyUserAccess(context, CustomerId);
        const db = CustomerId
          ? await getDatabaseOneCustomer(context, CustomerId)
          : await getDatabase(context);
        const thingData = await getThingById({
          thingId: ThingID,
          projection: { PaymentOptions: 1 },
          db,
        });
        const paymentOption = findPaymentOption(thingData, PaymentType);

        let sendTransaction, terminalId;

        switch (PaymentType) {
          case "Atrium":
            terminalId = paymentOption?.TerminalId;
            sendTransaction = await sendAtriumTransaction(
              paymentOption,
              Currency,
              Amount,
              CardNumber,
              CustomerId,
              PaymentType,
              Device,
              ThingID,
              db
            );
            break;
          case "CBORD":
            sendTransaction = await sendCboardTransaction(
              paymentOption,
              CardNumber,
              Amount,
              Currency,
              CustomerId,
              PaymentType,
              Device,
              ThingID,
              db
            );
            break;
          default:
            throw new Error(`Unsupported PaymentType: ${PaymentType}`);
        }        
        log.info("sendTransaction ********", sendTransaction);
        return sendTransaction
      } catch (err) {
        log.error("Error in sendTransaction *********:", err);
        throw new Error(err.message);
      }
    }
  }
}
