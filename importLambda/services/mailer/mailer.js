const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");
const {senderEmail, region} = require("../../config/config");

const REGION = region;
const FROM_EMAIL = senderEmail;
const CHARSET = 'UTF-8';
const DEFAULT_SUBJECT = 'failed imports';

module.exports.sendEmailV2 = async ({ data, accessParams, subject = DEFAULT_SUBJECT }) => {
  try {
    const sesv2 = new SESv2Client({
      region: REGION,
      credentials: accessParams
    });

    const emailParams = {
      Content: {
        Simple: {
          Body: {
            Html: {
              Data: data.html,
              Charset: CHARSET,
            },
            Text: {
              Data: data.text || data.html, // Use HTML as text if text is not provided
              Charset: CHARSET,
            },
          },
          Subject: {
            Data: subject,
            Charset: CHARSET,
          },
        },
      },
      Destination: {
        ToAddresses: Array.isArray(data.to) ? data.to : [data.to],
        CcAddresses: Array.isArray(data.cc) ? data.cc : [data.cc],
      },
      FromEmailAddress: FROM_EMAIL,
    };

    const command = new SendEmailCommand(emailParams);
    await sesv2.send(command);
    return true;
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
};