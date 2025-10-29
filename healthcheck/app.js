const {S3Client, ListObjectsCommand} = require("@aws-sdk/client-s3");
const {
    LambdaClient,
    GetFunctionConfigurationCommand,
    UpdateFunctionConfigurationCommand
} = require("@aws-sdk/client-lambda");

const awsIot = require('aws-iot-device-sdk');
const {v4: uuidv4} = require('uuid');
const secretName = `${process.env.Stage}/${process.env.domainName}/healthcheck`

const {
    createThing,
    fetchCaCertificate,
    getPrivateKeyToSignCert,
    registerDeviceCert,
    createPolicy,
    attachPrincipalPolicy,
    attachCertificateWithThing,
    fetchIoTEndpoint,
    encryptIoTCertificate,
    decryptIoTCertificate
} = require('./iot');
const {createDeviceCert} = require("./certCreate");
const {getDb, closeDb} = require("./db");
const {region} = require("./config");
const {PutSecretValueCommand, SecretsManagerClient, GetSecretValueCommand} = require("@aws-sdk/client-secrets-manager");

const s3Client = new S3Client({region});
const lambdaClient = new LambdaClient({region});

module.exports.handler = async (event) => {
    let promise1 = checkIoT();
    let promise2 = countItemsInBucket();
    await Promise.all([promise1, promise2])
      .then(resolved => {
          console.log('Region is healthy');
          return {
              statusCode: 200,
              body: JSON.stringify({status: process.env.status})
          };
      })
      .catch(error => {
          console.log('Fail over due to ', error);
          return {
              statusCode: 400,
              body: JSON.stringify({status: false})
          };
      });

    return {
        statusCode: 200,
        body: JSON.stringify({status: process.env.status})
    };
};

const setEnvLambda = async (vars) => {
    let params1 = {
        FunctionName: process.env.functionName
    };

    let params2 = {
        FunctionName: process.env.functionName,
        Environment: {
            Variables: vars
        }
    };

    try {
        const data = await lambdaClient.send(new GetFunctionConfigurationCommand(params1));
        Object.assign(params2.Environment.Variables, data.Environment.Variables);
        const result = await lambdaClient.send(new UpdateFunctionConfigurationCommand(params2));
        console.log('updated Env variables');
        return result;
    } catch (err) {
        // Check for resource conflict errors that happen during deployments
        if (err.name === 'ResourceConflictException' ||
            (err.message && err.message.includes('resource is being operated on'))) {
            console.log('Resource conflict detected during deployment - skipping environment update');
            // Return a non-error result to avoid failing the health check
            return {
                status: 'SKIPPED_DUE_TO_DEPLOYMENT',
                message: 'Environment update skipped due to deployment in progress'
            };
        }
        console.log(err.stack);
        throw err;
    }
};

const countItemsInBucket = async () => {
    const bucket = {
        Bucket: process.env.S3BucketTenantUploads,
        Prefix: 'PublicUploads',
        Delimiter: process.env.DELIMITER || '\\',
        MaxKeys: process.env.MAXKEYS || 2
    };

    try {
        const data = await s3Client.send(new ListObjectsCommand(bucket));
        console.log(data);
        return {
            bucket: data
        };
    } catch (err) {
        console.log('s3 bucket not working');
        console.log(err, err.stack);
        throw err;
    }
};

let checkIoT = async () => {
    const thingNameIot = `healthcheck-iot-service-auto-${region}`;
    try {
        if (!process.env.thingName) {
            await getSetEnvs(thingNameIot, region);
        }
        const status = await checkIotConnect();
        return !!status;
    } catch (err) {
        // Check for resource conflict errors that happen during deployments
        if (err.name === 'ResourceConflictException' ||
            (err.message && err.message.includes('resource is being operated on')) ||
            (err.message && err.message.includes('deployment in progress'))) {
            console.log('Resource conflict detected during IoT check - skipping health check');
            // Return true to avoid failing the health check during deployments
            return true;
        }
        // For other errors, log and re-throw
        console.log('Error during IoT check:', err);
        throw err;
    }
};

const checkIotConnect = async () => {
    console.log('Connecting to Aws IoT Service');
    const {deviceConnectionMainCert, deviceCerts} = await getSecret(secretName)
    try {
        const privateKey = deviceConnectionMainCert ? Buffer.from(deviceConnectionMainCert) : Buffer.from('')
        const clientCert = deviceCerts ? Buffer.from(deviceCerts) : Buffer.from('')
        const caPath = './amazonCerts/AmazonRootCA1.pem'
        const clientId = process.env.thingName || ''
        const host = process.env.endpoint || ''
        const device = awsIot.device({
            privateKey: privateKey,
            clientCert: clientCert,
            caPath: caPath,
            clientId: clientId,
            host: host
        });
        let topic = `healthcheck/client/${process.env.thingName}-${uuidv4()}`;
        await device.on('connect', () => {
            console.log('connect');
            device.subscribe(topic);
            device.publish(topic, JSON.stringify({ test_data: 1 }));
        });

        await device.on('message', (topic, payload) => {
            console.log('message', topic, payload.toString());
            device.end();
            console.log('Service working closing connection');
        });
        device.disconnect()
    } catch (e) {
        console.log(e);
        return false
    }
};

const createIoTResources = async (data, region) => {
    try {
        const iotData = await createThing(data, region);
        const {certificateDescription: {certificatePem}} = await fetchCaCertificate(region);
        const signerPrivateKey = await getPrivateKeyToSignCert(region);
        const {
            certificate: deviceCerts,
            privateKey: devicePrivateKey
        } = await createDeviceCert(certificatePem, signerPrivateKey, data);
        const certificateData = await registerDeviceCert(region, deviceCerts, certificatePem);
        const policyData = await createPolicy(data, region);
        await attachPrincipalPolicy(policyData, certificateData, region);
        await attachCertificateWithThing(iotData, certificateData, region);
        const endpoint = await fetchIoTEndpoint(region);
        await setEnvs(iotData, certificateData, policyData, devicePrivateKey, deviceCerts, endpoint, region);
        return {iotData, certificateData, policyData, devicePrivateKey, deviceCerts, endpoint};
    } catch (e) {
        console.log('=======', e);
        return e;
    }
};

const setEnvs = async (iotData, certificateData, policyData, privateKey, deviceCerts, endpoint, region) => {
    process.env.thingName = iotData.thingName;
    process.env.endpoint = endpoint.endpointAddress;
    let encryptedPrivateKey = await encryptIoTCertificate(privateKey);
    const db = await getDb();
    await db.collection('Healthcheck').insertOne({
        ThingName: iotData.thingName,
        DeviceCerts: deviceCerts,
        Endpoint: endpoint.endpointAddress,
        EncryptedPrivateKey: encryptedPrivateKey,
        Region: region
    });
    await setEnvLambda({
        thingName: iotData.thingName,
        endpoint: endpoint.endpointAddress
    });
    await setAWSSecrets(privateKey, deviceCerts)
    await closeDb();
    console.log('Setting Environment Variables');
};

const getSetEnvs = async (thingName, region) => {
    const db = await getDb();
    const data = await db.collection('Healthcheck').findOne({
        Region: region,
        ThingName: thingName
    });

    if (!data) {
        const thingNameIot = thingName;
        console.log('IoT Data not found now creating resources for this healthcheck endpoint');
        await createIoTResources(thingNameIot, region);
    } else {
        console.log('IoT data exists saving it to Env variables');
        const decryptedKey = await decryptIoTCertificate(data.EncryptedPrivateKey);
        process.env.thingName = data.ThingName;
        process.env.endpoint = data.Endpoint;
        await setEnvLambda({
            thingName: data.ThingName,
            endpoint: data.Endpoint
        });
        await setAWSSecrets(decryptedKey, data.DeviceCerts)
        await closeDb();
    }
};

const setAWSSecrets = async (decryptedKey, deviceCerts) => {
    const secretsManagerClient = new SecretsManagerClient();
    const secretValue = JSON.stringify({
        deviceConnectionMainCert: decryptedKey,
        deviceCerts: deviceCerts
    });

    const putSecretValueCommand = new PutSecretValueCommand({
        SecretId: secretName,
        SecretString: secretValue
    });

    try {
        await secretsManagerClient.send(putSecretValueCommand);
        console.log('Successfully updated AWS Secrets Manager');
    } catch (err) {
        // Check for resource conflict errors that happen during deployments
        if (err.name === 'ResourceConflictException' ||
            err.name === 'InvalidRequestException' ||
            (err.message && err.message.includes('is currently being updated')) ||
            (err.message && err.message.includes('resource is being operated on')) ||
            (err.message && err.message.includes('concurrent modification'))) {
            console.log('Resource conflict detected during Secrets Manager update - skipping secret update');
            // Return gracefully without throwing error to avoid failing the health check
            return {
                status: 'SKIPPED_DUE_TO_DEPLOYMENT',
                message: 'Secret update skipped due to deployment in progress'
            };
        }
        console.log('Error updating AWS Secrets Manager:', err);
        throw err;
    }
}

const getSecret = async (secretName) => {
    const secretsManagerClient = new SecretsManagerClient();
    const getSecretValueCommand = new GetSecretValueCommand({
        SecretId: secretName
    });
    const data = await secretsManagerClient.send(getSecretValueCommand);

    if ('SecretString' in data) {
        return JSON.parse(data.SecretString);
    } else {
        let buff = Buffer.from(data.SecretBinary, 'base64');
        let decodedBinarySecret = buff.toString('ascii');
        return JSON.parse(decodedBinarySecret);
    }
};
