const nodemailer = require('nodemailer')
// const ses = require('nodemailer-ses-transport')
const { senderEmail, region } = require('../config/config')
const { APPROVAL_SIGNUP, ACCOUNT, CHANGED_PASSWORD, SET_PASSWORD} = require('../helpers/success-constants')
const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");

module.exports = {
  sendEmail: ({ data, accessParams, subject, isService = false }) => {
    return new Promise((resolve, reject) => {
      const sesTransporter = nodemailer.createTransport(ses(accessParams))
      const subjectFinder = isService ? subject : subjectFunction(subject)
      sesTransporter.sendMail({
        to: data.to,
        from: senderEmail,
        subject: subjectFinder,
        html: data.html,
        attachments: data.attachments,
        text: data.html
      }).then(response => {
        resolve(true)
      }).catch(error => {
        console.log(error)
        reject(error)
      })
    })
  }
}

module.exports.sendEmailV2 = async ({ data, accessParams, subject, isService = false }) => {
  try {
    const sesv2 = new SESv2Client({
      region: region,
      credentials: accessParams
    });
    const subjectFinder = isService ? subject : subjectFunction(subject);
    const emailParams = {
      Content: {
        Simple: {
          Body: {
            Html: {
              Data: data.html,
              Charset: 'UTF-8',
            },
            Text: {
              Data: data.text || data.html, // Assuming you want to use the HTML as text if text is not provided
              Charset: 'UTF-8',
            },
          },
          Subject: {
            Data: subjectFinder,
            Charset: 'UTF-8',
          },
        },
      },
      Destination: {
        ToAddresses: Array.isArray(data.to) ? data.to : [data.to],
        CcAddresses: Array.isArray(data.cc) ? data.cc : [data.cc],
      },
      FromEmailAddress: senderEmail,
    };

    const command = new SendEmailCommand(emailParams);
    await sesv2.send(command);
    return true;
  } catch (err) {
    throw err;
  }
};



const subjectFunction = (subject) => {
  if (subject === 'admin-pass' || subject === 'change-pass') {
    return CHANGED_PASSWORD
  } else if (subject === 'add-user') {
    return ACCOUNT
  } else if (subject === 'set-pwd') {
    return SET_PASSWORD
  } else {
    return APPROVAL_SIGNUP
  }
}
