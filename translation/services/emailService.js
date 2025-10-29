const {sendEmailV2} = require("../mailer/mailer");
const {getStsCredentials} = require("../helpers/credentialGenerator");
const {emailServicePolicy} = require("../tokenVendingMachine/policyTemplates");
const {generateEJSTemplate} = require("../mailer/ejsTemplate");

const sendEmailAttachments = async (job, fromEmail, to, subject, body, cc) => {
    try {
        const policy  = await emailServicePolicy()
        const credentials = await getStsCredentials(policy)
        const accessParams = {
            accessKeyId: credentials.Credentials.AccessKeyId,
            secretAccessKey: credentials.Credentials.SecretAccessKey,
            sessionToken: credentials.Credentials.SessionToken
        }
            const template = await generateEJSTemplate({
                data: {
                    job,
                }, filename: 'email-service'
            })
            const emailData = {
                from: fromEmail, to: to, cc: cc, html: template
            }
            const response = await sendEmailV2(
              { data: emailData, accessParams, subject })
            return {response}
    } catch (error) {
        throw error
    }
}

module.exports = {sendEmailAttachments}