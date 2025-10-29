const ejs = require('ejs');
const path = require('path');
const baseTemplate = path.join(__dirname, '..', 'mailer', 'template', 'base-template.ejs');

module.exports.generateEJSTemplate = async ({ data, filename }) => {
  try {
    return ejs.renderFile(baseTemplate, {data, filename});
  } catch (err) {
    console.error(err);
    throw new Error('INVALID_EMAIL_TEMPLATE');
  }
};