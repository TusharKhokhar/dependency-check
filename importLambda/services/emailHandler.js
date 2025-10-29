const {getIamCredentials} = require("./iot-handler");
const {region, Stage, domainName, bucketName} = require("../config/config");
const {fetchSignedUrlEmailServicePolicy} = require("./policy");
const {getStsCredentials} = require("./sts");
const {generateEJSTemplate} = require("./mailer/ejsTemplate");
const {sendEmailV2} = require("./mailer/mailer");
const {S3Client, GetObjectCommand} = require("@aws-sdk/client-s3");
const {getSignedUrl} = require("@aws-sdk/s3-request-presigner");

const sendEmailAttachments = async (attachments, fromEmail, to, subject, body, cc, customerId, expiry = 7, serviceName, csv) => {
    try {
        const fileKeys = attachments.map(dd => dd.fileName);
        const fetchIamCred = await getIamCredentials(region, Stage, domainName);
        const policy = await fetchSignedUrlEmailServicePolicy({ CustomerID: customerId });
        const credentials = await getStsCredentials(policy);
        const accessParams = {
            accessKeyId: credentials.Credentials.AccessKeyId,
            secretAccessKey: credentials.Credentials.SecretAccessKey,
            sessionToken: credentials.Credentials.SessionToken
        };
        const { urls } = await getFileSizeAndUrls(bucketName, fileKeys, expiry, accessParams, serviceName, customerId, fetchIamCred);
        const data = { urls: urls, attachments, isLinks: csv !== '', body: body };
        const template = await generateEJSTemplate({ data, filename: 'email-service' });
        const emailData = { from: fromEmail, to: to, cc: cc, html: template };
        const response = await sendEmailV2({ data: emailData, accessParams, subject, isService: true });
        return { response };
    } catch (error) {
        throw error;
    }
};

const sendEmailFailure = async (fromEmail, to, subject, body, cc, customerId, serviceName) => {
    try {
        const policy = await fetchSignedUrlEmailServicePolicy({ CustomerID: customerId });
        const credentials = await getStsCredentials(policy);
        const accessParams = {
            accessKeyId: credentials.Credentials.AccessKeyId,
            secretAccessKey: credentials.Credentials.SecretAccessKey,
            sessionToken: credentials.Credentials.SessionToken
        };
        const template = await generateEJSTemplate({ data: {}, filename: serviceName });
        const emailData = { from: fromEmail, to: to, cc: cc, html: template };
        const response = await sendEmailV2({ data: emailData, accessParams, subject, isService: true });
        return { response };
    } catch (error) {
        throw error;
    }
};

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

module.exports = {
    sendEmailAttachments,
    sendEmailFailure
};