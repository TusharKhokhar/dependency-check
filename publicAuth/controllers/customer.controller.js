const { setErrorResponse, setSuccessResponse } = require('../services/api-handler')
const ERROR = require('../helpers/error-keys')
const { getStsCredentials } = require('../helpers/credentialGenerator')
const { emailPolicy } = require('../tokenVendingMachine/policyTemplates')
const { sendEmail } = require('../mailer/mailer')
const model = require('../models/index')
const stringConstant = require('../helpers/success-constants')
const { generateEJSTemplate } = require('../mailer/ejsTemplate')
const { MongoDB } = require('../config/config')
const { STANDARD_TIER } = require('../helpers/constants')
const premiumDb = require('mongodb').MongoClient
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

module.exports.signUpCustomer = (req, res) => {
  const {
    Label,
    CustomerName,
    CustomerType,
    DisplayName,
    Description,
    DomainName,
    Tier,
    Tags,
    Email
  } = req.body
  const newCustomer = {
    Label,
    CustomerName,
    CustomerType,
    DisplayName,
    Description,
    DomainName,
    Tier,
    Tags,
    Email
  }
  return new Promise((resolve, reject) => {
    model.customers.getCustomer({ CustomerName, DomainName }, (err, customers) => {
      if (err) {
        reject(ERROR.UNKNOWN_ERROR)
      } else if (customers) {
        if (customers.CustomerName && customers.CustomerName.toLowerCase() === CustomerName.toLowerCase()) {
          reject(ERROR.CUSTOMER_ALREADY_EXIST)
        } else if (customers.DomainName && customers.DomainName.toLowerCase() === DomainName.toLowerCase()) {
          reject(ERROR.DOMAIN_ALREADY_EXIST)
        }
      } else {
        model.customers.createCustomer(newCustomer, (err, customerDetails) => {
          if (err) {
            reject(ERROR.GETTING_DATA)
          } else {
            if (newCustomer.Tier !== STANDARD_TIER) {
              console.log('DB ', `${MongoDB}${process.env.dbName}-${DomainName}`)
              const client = premiumDb.connect(`${MongoDB}${process.env.dbName}-${DomainName}`, {
                useUnifiedTopology: true,
                useNewUrlParser: true
              })
              const addCustomer = client.db(`${process.env.dbName}-${DomainName}`).collection('Customers').insertOne(customerDetails)
              client.close()
              resolve({
                customers: addCustomer,
                message: stringConstant.CUSTOMER_SAVE_SUCCESS
              })
            } else {
              resolve({
                customers: customerDetails,
                message: stringConstant.CUSTOMER_SAVE_SUCCESS
              })
            }
          }
        })
      }
    })
  }).then(async response => {
    try {
      const policy = await emailPolicy()
      const credentials = await getStsCredentials(policy)
      const accessParams = {
        accessKeyId: credentials.Credentials.AccessKeyId,
        secretAccessKey: credentials.Credentials.SecretAccessKey,
        sessionToken: credentials.Credentials.SessionToken
      }
      const htmlTemplate = await generateEJSTemplate({ data: { CustomerName }, filename: 'sign-up' })
      const supportTemplate = await generateEJSTemplate({ data: { CustomerName }, filename: 'notify' })
      await sendEmail({ data: { html: htmlTemplate, to: Email }, accessParams: accessParams, subject: 'sign-up' })
      await sendEmail({ data: { html: supportTemplate, to: Email }, accessParams: accessParams, subject: 'notify' })
      await setSuccessResponse(response, res, req)
    } catch (err) {
      console.log(err)
      setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
    }
  }).catch(error => {
    console.log(error)
    setErrorResponse(null, error, res)
  })
}

module.exports.fetchCustomer = (req, res) => {
  log.lambdaSetup(req, 'fetchCustomer', 'customer.controller')
  model.customers.fetchCustomer((err, data) => {
    if (err) {
      setErrorResponse(null, ERROR.UNKNOWN_ERROR, res)
    } else {
      setSuccessResponse(data, res, req)
    }
  })
}
