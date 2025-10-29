const axios = require('axios')
const { securityCode } = require('./sms-templates')
const {smsUser, smsPass} = require('../config/config');
const {awsTextMessageHandler} = require("./awsTextMessage");

module.exports = {
  sendSMSUsingEZTexting: (mobile, code, callback) => {
    const apiUrl = 'https://a.eztexting.com/v1/messages'
    const base64 = Buffer.from(`${smsUser}:${smsPass}`).toString('base64')
    const message = securityCode(code)
    const options = {
      method: 'POST',
      url: apiUrl,
      headers: {
        'content-type': 'application/json',
        authorization: `Basic ${base64}`
      },
      data: JSON.stringify({
        'message': message,
        'toNumbers': [mobile]
      })
    };
    axios(options)
        .then(function (response) {
          console.log(JSON.stringify(response.data));
          callback(null, JSON.stringify(response.data))
        })
        .catch(function (error) {
          console.log(error)
          callback(error, null)
        })
  },
  notifyUserOfJobUpload: (text, template, currentSMS, totalSMS) => {
    return new Promise((resolve, reject) => {
      console.log(`Sending SMS ${currentSMS}/${totalSMS}:\n${template}`);
      const apiUrl = 'https://a.eztexting.com/v1/messages'
      const base64 = Buffer.from(`${smsUser}:${smsPass}`).toString('base64')
      const options = {
        method: 'POST',
        url: apiUrl,
        headers: {
          'content-type': 'application/json',
          authorization: `Basic ${base64}`
        },
        data: JSON.stringify({
          'message': template,
          'toNumbers': [text]
        })
      };
      axios(options)
          .then(function (response) {
            resolve(JSON.stringify(response.data))
          })
          .catch(function (error) {
            console.log(error)
            reject(error)
          })
    })
  },
  sendJobText: async (text, template, currentSMS, totalSMS, customerData) => {
    console.log(`Sending SMS ${currentSMS}/${totalSMS}:\n${template}`);
    return awsTextMessageHandler({phoneNumber: text, messageBody: template, customerData})
  },
  sendOtpText: async (mobile, code, customerData) => {
    const message = securityCode(code)
    return awsTextMessageHandler({phoneNumber: mobile, messageBody: message, customerData})
  }
}
