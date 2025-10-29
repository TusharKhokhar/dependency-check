const Express = require('express')
const Router = Express.Router()
const { fetchCustomer } = require('../controllers/customer.controller')
const { userValidator, uploadValidator, smsAuditValidator } = require('../validators/index')
const {
  generateMultipleSignedUrls,
  generateMultipleSignedUrlsV2,
  confirmFileUpload,
  releaseCodeJobFinder,
  updateJob, generateTheme, printJobs, failedJobNotify, fetchLogo, updateTranslationJob, updateTranslationStatus,
  ippResponseSignedUrl
} = require('../controllers/upload.controller')
const {
  validateActivationCode,
  fetchConfigDataByThingTagId,
  getThingCertificates,
  publishMessageToIot,
  getStsCredential, getThingByAttributes
} = require('../controllers/thing.controller')
const { stripeWebhook } = require('../controllers/stripe.controller')
const { requestToken } = require('../controllers/license.controller')
const {
  geoLocate,
  login,
  confirmOtp,
  resetPassword,
  fetchCustomerDetailsByDomain,
  confirmPasswordApi, refreshToken, chooseMfaMethod, loginOAuth2, providersLogin, findCardNumber, validateCardPin,
  getUserByEmail, userSignUp
} = require('../controllers/auth.controller')
const { sendSuccessToConnectedClients } = require('../controllers/socket.controller')
const socketValidator = require('../validators/socket.validator')
const { authorizeResponse } = require('../controllers/authorize.controller.js')
const { eghlResponse } = require('../controllers/eghl.controller.js')
const { heartlandResponse } = require('../controllers/heartland.controller.js')
const { xenditResponse } = require('../controllers/xendit.controller.js')
const { monerisResponse } = require('../controllers/moneris.controller.js')
const {getLatestKioskVersion} = require("../controllers/version.controller");
const {countryCodes} = require("../services/countryCodes");
const { braintreeTransaction } = require('../controllers/braintree.controller.js')
const { stripeValidator } = require('../validators/stripe.validator')
const { webhookRespnoseValidator } = require('../validators/webhook.validator')
const { authorizeNetValidator } = require('../validators/authorizeNet.validator')
const { eghlValidator } = require('../validators/eghl.validator')
const { monerisValidator } = require('../validators/moneris.validator')
const { xenditValidator } = require('../validators/xendit.validator')
const { braintreeValidator } = require('../validators/braintree.validator')
const { heartlandValidator } = require('../validators/heartland.validator')
const { braintreeMobileTransaction } = require('../controllers/mobile/braintree.controller.js')
const { nayaxResponse } = require('../controllers/nayax.controller.js')
const { nayaxValidator } = require('../validators/nayax.validator.js')
const {faxCallback} = require("../controllers/fax.controller");
const { iPay88Validator } = require('../validators/ipay88.validator.js')
const { iPay88Response } = require('../controllers/ipay88.controller.js')
const { saveSmsAuditLog } = require('../controllers/smsAudit.controller.js')

/**
 * User management APIs
 */

Router.post('/login', userValidator.login, loginOAuth2)
Router.post('/v2/login', userValidator.login, loginOAuth2)
Router.post('/sso/confirm', userValidator.sso, providersLogin)
Router.post('/authOption', chooseMfaMethod)
Router.post('/signup', userSignUp)
Router.post('/admin/login', userValidator.login, loginOAuth2)

Router.put('/refreshToken', refreshToken)
Router.put('/validateOtp/:id', userValidator.confirmOtp, confirmOtp)
Router.put('/resetPassword', userValidator.resetPassword, resetPassword)
Router.put('/confirmPassword', userValidator.confirmPasswordApi, confirmPasswordApi)

/**
 * Upload files APIs
 */

Router.post('/signedUrls', uploadValidator.signedUrls, generateMultipleSignedUrls)
Router.post('/signedUrlsV2', uploadValidator.signedUrls, generateMultipleSignedUrlsV2)
Router.post('/ipp/response', ippResponseSignedUrl)
Router.get('/releaseCode/:code', releaseCodeJobFinder)
Router.get('/printJobs', printJobs)
Router.post('/confirmFileUpload', uploadValidator.confirmFileUpload, confirmFileUpload)
Router.post('/job/fail', failedJobNotify)

/**
 * Kiosk APIs
 */

Router.get('/validateActivationCode', validateActivationCode)
Router.get('/thing', getThingByAttributes)
Router.get('/configData', fetchConfigDataByThingTagId)
Router.get('/thingCert/:id', getThingCertificates)
Router.get('/requestToken', requestToken)

// this api is called by server to update file status of is processed
Router.put('/updateJob', uploadValidator.updateJob, updateJob)
Router.put('/job', uploadValidator.updateJob, updateTranslationJob)
Router.post('/translate/complete',  updateTranslationStatus)
//this api is used by the system to identify the user's username using primary email address
Router.post('/getUserEmailAddress', getUserByEmail)
Router.post('/iot/sts', getStsCredential)

// central db connection

Router.post('/sendStatus', socketValidator.sendStatus, sendSuccessToConnectedClients)
Router.get('/fetchCustomer', fetchCustomer)
Router.get('/generateTheme', generateTheme)
Router.put('/locate', userValidator.locate, geoLocate)

// Others

Router.get('/version', getLatestKioskVersion)
Router.get('/domainInfo', fetchCustomerDetailsByDomain)
Router.get('/countryCodes', countryCodes)
Router.post('/fax/notify', faxCallback)

// Webhook API Endpoint
Router.post('/stripe/webhook/:id', stripeValidator, webhookRespnoseValidator, stripeWebhook)
Router.post('/authorize/response/:id', authorizeNetValidator, webhookRespnoseValidator, authorizeResponse)
Router.post('/eghl/response', eghlValidator, webhookRespnoseValidator, eghlResponse)
Router.post('/heartland/response', heartlandValidator, webhookRespnoseValidator, heartlandResponse)
Router.post('/xendit/response/:id', xenditValidator, webhookRespnoseValidator, xenditResponse)
Router.post('/moneris/response', monerisValidator, webhookRespnoseValidator, monerisResponse)
Router.post('/braintree/transaction', braintreeValidator, webhookRespnoseValidator, braintreeTransaction)
Router.post('/mobile/braintree/transaction', braintreeValidator, webhookRespnoseValidator, braintreeMobileTransaction)
Router.post('/nayax/response', nayaxValidator, nayaxResponse)
Router.post('/ipay88/response', iPay88Validator, webhookRespnoseValidator, iPay88Response)
Router.post('/smsAuditLog', smsAuditValidator.saveSmsAuditLog, saveSmsAuditLog)

module.exports = Router
