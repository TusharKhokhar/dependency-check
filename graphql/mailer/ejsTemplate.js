const ejs = require('ejs')
const path = require('path')
const { INVALID_EMAIL_TEMPLATE } = require('../helpers/error-keys')
const baseTemplate = path.join(__dirname, '.', '..', 'mailer', 'template', 'base-template.ejs')

module.exports.generateEJSTemplate = ({ data, userData, pwdData, filename }) => {
  return new Promise((resolve, reject) => {
    ejs.renderFile(baseTemplate, {
      data,
      userData,
      pwdData,
      filename
    }, (err, html) => {
      if (err) {
        reject({ message: INVALID_EMAIL_TEMPLATE })
      } else {
        resolve(html)
      }
    })
  })
}
