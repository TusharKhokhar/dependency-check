const { senderEmail, region } = require('../config/config')
const {
  E_PRINT_SIGNUP_SUBJECT, NEW_CUSTOMER_SIGNUP, PASSWORD_RESET_REQUEST, UPLOAD_MAIL_SUBJECT, MFA_REQUIRED_MAIL_SENT,
  ACCOUNT_LOCKED, SIGNUP_USER
} = require('../helpers/constants')
const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");

module.exports = {
  sendEmail: async ({ data, accessParams, subject, uploadSubject }) => {
      try {
        const sesv2 = new SESv2Client({
          region: region,
          credentials: accessParams
        });
        const subjectFinder = uploadSubject || subjectFunction(subject);
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
  }
}

const subjectFunction = (subject) => {
  switch (subject) {
  case 'notify':
    return NEW_CUSTOMER_SIGNUP
  case 'reset-pwd':
    return PASSWORD_RESET_REQUEST
  case 'upload-file':
    return UPLOAD_MAIL_SUBJECT
  case 'mfa-options':
    return MFA_REQUIRED_MAIL_SENT
  case 'account-locked':
    return ACCOUNT_LOCKED
  case 'signup-user':
    return SIGNUP_USER
  default:
    return E_PRINT_SIGNUP_SUBJECT
  }
}
