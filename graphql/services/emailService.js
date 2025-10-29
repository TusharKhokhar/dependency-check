const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const {sendEmailV2} = require("../mailer/mailer");
const {getStsCredentials} = require("../helpers/credentialsGenerator");
const {fetchSignedUrlEmailServicePolicy} = require("../tokenVendingMachine/policies/customization");
const {bucketName, Stage, domainName, region} = require("../config/config");
const {generateEJSTemplate} = require("../mailer/ejsTemplate");
const {getIamCredentials} = require("../helpers/util");
const {getSignedUrl} = require("@aws-sdk/s3-request-presigner");

const getFileSizeAndUrls = async (bucketName, fileKeys, expiry, creds, serviceName, customerId, fetchIamCred) => {
    const parsedCredentials = JSON.parse(fetchIamCred);
    const s3Client = new S3Client({
        region: region,
        credentials: {
            accessKeyId: parsedCredentials?.AccessKeyId,
            secretAccessKey: parsedCredentials?.SecretAccessKey,
        }
    });
    const urls = [];
    for (const key of fileKeys) {
        const params = {
            Bucket: bucketName,
            Key: `${serviceName}/${customerId}/${key}`,
            Expires: expiry * 24 * 60 * 60
        };
        const command = new GetObjectCommand(params);
        const url = await getSignedUrl(s3Client, command, { expiresIn: expiry * 24 * 60 * 60 });
        urls.push(url);
    }
    return { urls };
};

const downloadFiles = async (bucketName, key, accessParams, serviceName, customerId) => {
    const s3Client = new S3Client({
        region: region,
        credentials: {
            accessKeyId: accessParams.accessKeyId,
            secretAccessKey: accessParams.secretAccessKey,
            sessionToken: accessParams.sessionToken
        },
    });
    const params = {
        Bucket: bucketName,
        Key: `${serviceName}/${customerId}/${key}`
    };
    try {
        const command = new GetObjectCommand(params);
        const { Body } = await s3Client.send(command);
        const chunks = [];
        for await (const chunk of Body) {
            chunks.push(chunk);
        }
        const fileContent = Buffer.concat(chunks);
        return { filename: `${serviceName}/${customerId}/${key}`, content: fileContent };
    } catch (err) {
        console.error("Error downloading file:", err);
        throw err;
    }
};


const sendEmailAttachments = async (attachments, fromEmail, to, subject, body, cc, customerId, expiry = 7, serviceName) => {
    try {
        let fileKeys = await attachments.map(dd => dd.SystemFileName)
        const fetchIamCred = await getIamCredentials(region, Stage, domainName)
        const policy  = await fetchSignedUrlEmailServicePolicy({CustomerID: customerId})
        const credentials = await getStsCredentials(policy)
        const accessParams = {
            accessKeyId: credentials.Credentials.AccessKeyId,
            secretAccessKey: credentials.Credentials.SecretAccessKey,
            sessionToken: credentials.Credentials.SessionToken
        }
        const { urls } = await getFileSizeAndUrls(bucketName, fileKeys, expiry, accessParams, serviceName, customerId, fetchIamCred);
            const data = {urls: urls, attachments, isLinks: true}
        data.body = body
            const template = await generateEJSTemplate({
                data, userData: {},
                pwdData: {}, filename: 'email-service'
            })
            const emailData = {
                from: fromEmail, to: to, cc: cc, html: template
            }
            const response = await sendEmailV2(
              { data: emailData, accessParams, subject, isService: true })
            return {response}
    } catch (error) {
        throw error
    }
}

module.exports = {sendEmailAttachments, downloadFiles}