const {bucketNameConverted} = require("./config/config");
const {getStsCredentials} = require("./helpers/credentialGenerator");
const config = require("./config/config");
const { S3Client, GetObjectCommand, PutObjectCommand} = require('@aws-sdk/client-s3');
const { getSignedUrl: getSignedUrlCommand } = require("@aws-sdk/s3-request-presigner");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const {generateSASTokenBlob} = require("./azureServicie");
const axios = require("axios");
const {iotPolicy} = require("./tokenVendingMachine/policyTemplates");
const {getDb} = require("./config/dbHandler");
const {getObjectId: ObjectId} = require("./helpers/objectIdConverter");
const {retrieveEndpoint, publishToTopic} = require("./services/iot");
const {v4: uuidv4} = require("uuid");

const  getSignedUrls = async (jobData, customerId, converted, fetchIamCred) => {
    const signedUrls = []
    for (let upload of jobData.JobList) {
        upload.customerId = customerId
        const obj = {
            signedAccessLink: await getSignedUrl(upload, converted, fetchIamCred),
            fileName: converted ? `PublicUploads/TranslationService/${customerId}/Converted/${upload.NewFileNameWithExt}` :
              `PublicUploads/TranslationService/${customerId}/${upload.NewFileNameWithExt}`,
            originalFileName: upload.OriginalFileNameWithExt
        }
        signedUrls.push(obj)
    }
    return signedUrls
}

const getSignedUrl = async (data, converted, fetchIamCred) => {
    try {
        data.policy = await fetchSignedUrlPolicy(data, bucketNameConverted);
        const retrieveCredentials = fetchIamCred ? fetchIamCred : await getStsCredentials(data.policy);
        const accessParams = {
            accessKeyId: fetchIamCred ? fetchIamCred.AccessKeyId : retrieveCredentials.Credentials.AccessKeyId,
            secretAccessKey: fetchIamCred ? fetchIamCred.SecretAccessKey :
              retrieveCredentials.Credentials.SecretAccessKey,
            sessionToken: fetchIamCred ?
              null : retrieveCredentials.Credentials.SessionToken,
        };

        const s3Client = new S3Client({
            region: config.region,
            credentials: accessParams
        });

        const signedParams = {
            Bucket: bucketNameConverted,
            Key: converted ? `PublicUploads/TranslationService/${data.customerId}/Converted/${data.NewFileNameWithExt}`
              : `PublicUploads/TranslationService/${data.customerId}/${data.NewFileNameWithExt}`,
            Expires: fetchIamCred ? 7 * 24 * 60 * 60 : 3600
        };
        const command = new GetObjectCommand(signedParams);
        const signedUrl = await getSignedUrlCommand(s3Client, command, { expiresIn: fetchIamCred ? 7 * 24 * 60 * 60 : 3600 });
        return {
            signedUrl,
            expiryTime: fetchIamCred ? 7 * 24 * 60 * 60 : 3600,
        };
    } catch (error) {
        return error;
    }
};


const fetchSignedUrlPolicy = (parameters, bucketNameConverted) => {
    return new Promise((resolve, reject) => {
        resolve({
            policy: `{
                "Version": "2008-10-17",
                "Statement": [
                    {
                        "Sid": "fetchObjectFromS3Bucket",
                        "Effect": "Allow",
                        "Action":  "s3:GetObject",
                        "Resource": "arn:aws:s3:::${bucketNameConverted}/PublicUploads/TranslationService/${parameters.customerId}/*"
                    },
                    {
                        "Sid": "fetchObjectFromS3BucketAudio",
                        "Effect": "Allow",
                        "Action":  "s3:GetObject",
                        "Resource": "arn:aws:s3:::${bucketNameConverted}/PublicUploads/TranslationService/${parameters.customerId}/Audio/*"
                    }
                ]
            }`
        })
    })
}


const uploadSignedUrls = (customerId, bucketNameConverted) => {
    return new Promise((resolve, reject) => {
        resolve({
            policy: `{
                "Version": "2008-10-17",
                "Statement": [
                    {
                        "Sid": "uploadObjectToS3",
                        "Effect": "Allow",
                        "Action":  "s3:PutObject",
                        "Resource": "arn:aws:s3:::${bucketNameConverted}/PublicUploads/TranslationService/${customerId}/*"
                    },
                    {
                        "Sid": "uploadObjectToS3Audio",
                        "Effect": "Allow",
                        "Action":  "s3:PutObject",
                        "Resource": "arn:aws:s3:::${bucketNameConverted}/*"
                    }
                ]
            }`
        })
    })
}

const getAzureSecrets = async (region) => {
    try {
        const secretsManagerClient = new SecretsManagerClient({
            region: region
        });
        const secretName = `${config.Stage}/${config.domainName}/azure`;
        const data = await secretsManagerClient.send(new GetSecretValueCommand({ SecretId: secretName }));
        if ('SecretString' in data) {
            return JSON.parse(data.SecretString)
        } else {
            throw new Error("Secret value not found.");
        }
    } catch (err) {
        console.error("Error while getting secret value", err);
        throw err;
    }
};

const uploadToS3 = async (event, azureKeys, fileName, customerId, file) => {
    const policy = await uploadSignedUrls(event.jobData.CustomerID, bucketNameConverted);
    const retrieveCredentials = await getStsCredentials(policy);
    const accessParams = {
        accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
        secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
        sessionToken: retrieveCredentials.Credentials.SessionToken,
    };

    const s3Client = new S3Client({
        region: config.region,
        credentials: accessParams
    });
    const sasUrl = await generateSASTokenBlob(azureKeys, 'target', fileName)
    const bucketName = config.bucketNameConverted;
    const s3Key = `PublicUploads/TranslationService/${customerId}/Converted/${file}`;
    try {
        const response = await axios.get(sasUrl, { responseType: 'arraybuffer' });
        const downloaded = Buffer.from(response.data);
        const uploadParams = {
            Bucket: bucketName,
            Key: s3Key,
            Body: downloaded,
            ServerSideEncryption: 'AES256'
        };
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);
        return s3Key
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify('Error transferring file.'),
        };
    }
}

/**
 * Uploads a buffer to S3
 * @param {Buffer} buffer - The buffer to upload
 * @param {string} bucketName - S3 bucket name
 * @param {string} key - S3 key
 * @param {string} contentType - MIME type of the content
 * @returns {string} - S3 key of the uploaded object
 */
const uploadBufferToS3 = async (buffer, bucketName, key, contentType = 'application/octet-stream') => {
    try {
        const policy = await uploadSignedUrls(key.split('/')[3], bucketName); // Extract customerId from key
        console.log('policy: ',policy);
        const retrieveCredentials = await getStsCredentials(policy);
        const accessParams = {
            accessKeyId: retrieveCredentials.Credentials.AccessKeyId,
            secretAccessKey: retrieveCredentials.Credentials.SecretAccessKey,
            sessionToken: retrieveCredentials.Credentials.SessionToken,
        };

        const s3Client = new S3Client({
            region: config.region,
            credentials: accessParams
        });

        const uploadParams = {
            Bucket: bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            ServerSideEncryption: 'AES256'
        };
        console.log('uploadParams: ',uploadParams);

        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);
        console.log(`Successfully uploaded buffer to ${key}`);
        return key;
    } catch (error) {
        console.error('Error uploading buffer to S3:', error);
        throw error;
    }
};

const getIamCredentials = async (region, stage, domainName) => {
    const secretName = `${stage}/${domainName}/iam`
    const client = new SecretsManagerClient({region: region});
    try {
        const command = new GetSecretValueCommand({ SecretId: secretName });
        const data = await client.send(command);

        if ('SecretString' in data) {
            return JSON.parse(data.SecretString)
        } else {
            throw new Error('SecretString not found in data');
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
}

const sendMessageToIoTThing = async (event, response) => {
    const policy = iotPolicy()
    const credentials = await getStsCredentials(policy)
    const accessParams = {
        accessKeyId: credentials.Credentials.AccessKeyId,
        secretAccessKey: credentials.Credentials.SecretAccessKey,
        sessionToken: credentials.Credentials.SessionToken
    }
    const db = await getDb()
    let query = {CustomerID: ObjectId.createFromHexString(event.jobData.CustomerID),
        _id: ObjectId.createFromHexString(event.jobData.DeliveryMethod.ThingID)}
    const thingsData = await db.collection('Things').findOne(query)
    if (thingsData) {
        const topic = `cmd/eprintit/${event.jobData.CustomerID}/${thingsData.LocationID}/${thingsData.PrimaryRegion.ThingName}/translation`
        const endpoint = await retrieveEndpoint(config.region, accessParams)
        const message = {
            MessageID: uuidv4(),
            ThingName: thingsData.PrimaryRegion.ThingName,
            RequestType: 'translation',
            SessionID: event.jobData.DeliveryMethod.SessionID,
            UrlsMetaData: response
        }
        await publishToTopic(topic, message, endpoint, accessParams)
    } else {
        console.log(`Thing with thing id ${event.jobData.DeliveryMethod.ThingID} doesn't exists`)
    }
}

/**
 * Generates a signed URL specifically for audio files
 * @param {string} s3Key - Full S3 key for the audio file
 * @param {string} customerId - Customer ID
 * @param {object} iamCredentials - Optional IAM credentials for longer expiry
 * @returns {object} - Object containing the signed URL and expiry time
 */
const getAudioFileSignedUrl = async (s3Key, customerId, iamCredentials) => {
    try {
        console.log(`Generating signed URL for audio file: ${s3Key}`);
        
        // Validate inputs
        if (!s3Key) {
            throw new Error('S3 key is required for generating audio file URL');
        }
        
        if (!customerId) {
            throw new Error('Customer ID is required for generating audio file URL');
        }
        
        // Get credentials
        let accessParams;
        let expiryTime = 3600; // Default 1 hour
        
        if (iamCredentials) {
            // Use provided IAM credentials with longer expiry
            accessParams = {
                accessKeyId: iamCredentials.AccessKeyId,
                secretAccessKey: iamCredentials.SecretAccessKey,
                sessionToken: null
            };
            expiryTime = 7 * 24 * 60 * 60; // 7 days
            console.log('Using provided IAM credentials with 7-day expiry');
        } else {
            // Get temporary credentials
            console.log('No IAM credentials provided, getting temporary credentials');
            const policy = await fetchSignedUrlPolicy({ customerId }, bucketNameConverted);
            const credentials = await getStsCredentials(policy);
            accessParams = {
                accessKeyId: credentials.Credentials.AccessKeyId,
                secretAccessKey: credentials.Credentials.SecretAccessKey,
                sessionToken: credentials.Credentials.SessionToken
            };
            console.log('Generated temporary credentials with 1-hour expiry');
        }
        
        // Create S3 client
        const s3Client = new S3Client({
            region: config.region,
            credentials: accessParams
        });
        
        // Generate signed URL
        const signedParams = {
            Bucket: bucketNameConverted,
            Key: s3Key,
            Expires: expiryTime
        };
        
        console.log(`Generating signed URL with params: ${JSON.stringify(signedParams)}`);
        
        const command = new GetObjectCommand(signedParams);
        const signedUrl = await getSignedUrlCommand(s3Client, command, { expiresIn: expiryTime });
        
        console.log(`Successfully generated signed URL for audio file. URL length: ${signedUrl.length}`);
        
        return {
            signedUrl,
            expiryTime,
            key: s3Key, // Include the key for debugging
            bucket: bucketNameConverted
        };
    } catch (error) {
        console.error('Error generating audio file signed URL:', error);
        throw error;
    }
};

module.exports = {
    getSignedUrls, 
    fetchSignedUrlPolicy, 
    getAzureSecrets, 
    uploadSignedUrls, 
    getIamCredentials, 
    uploadToS3, 
    sendMessageToIoTThing,
    uploadBufferToS3,
    getSignedUrl,
    getAudioFileSignedUrl
}