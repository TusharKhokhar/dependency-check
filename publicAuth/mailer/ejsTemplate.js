// Custom include
const ejs = require('ejs')
const path = require('path')
const Promise = require('bluebird')
const baseTemplate = path.join(__dirname, '.', '..', 'mailer', 'templates', 'base-template.ejs')

/**
 * Method to generate HTML template using EJS
 * @param data
 * @param filename
 */
module.exports.generateEJSTemplate = ({ data, filename }) => {
  return new Promise((resolve, reject) => {
    ejs.renderFile(baseTemplate, {
      data,
      filename
    }, (err, html) => {
      if (err) {
        reject(err)
      } else {
        resolve(html)
      }
    })
  })
}
