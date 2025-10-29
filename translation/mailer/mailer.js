const { senderEmail, region } = require('../config/config')
const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");

module.exports.sendEmailV2 = async ({ data, accessParams, subject, isService = false }) => {
  try {
    const sesv2 = new SESv2Client({
      region: region,
      credentials: accessParams
    });
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
            Data: subject,
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
