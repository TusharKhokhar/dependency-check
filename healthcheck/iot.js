const { IoTClient, CreateThingCommand, CreateKeysAndCertificateCommand,
    CreatePolicyCommand, AttachPolicyCommand, AttachThingPrincipalCommand,
    DescribeCertificateCommand, DescribeEndpointCommand, RegisterCertificateCommand,
    ListCACertificatesCommand, DescribeCACertificateCommand } = require("@aws-sdk/client-iot");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const crypto = require("crypto");
const { algorithmName, secretEncryptionKeys } = require("./config");
let domainName = process.env.domainName || 'eprintitsaas.org';
let Stage = process.env.Stage || 'dev';

const createThing = async (data, region) => {
    const client = new IoTClient({ region: region });
    const params = { thingName: `${data}` };
    try {
        const command = new CreateThingCommand(params);
        return await client.send(command);
    } catch (err) {
        console.log('===>>>>>', err);
        throw err;
    }
};

const createDeviceCertificate = async (region) => {
    const client = new IoTClient({ region });
    const params = { setAsActive: true };
    try {
        const command = new CreateKeysAndCertificateCommand(params);
        return await client.send(command);
    } catch (err) {
        throw err;
    }
};

const createPolicy = async (data, region) => {
    const client = new IoTClient({ region });
    const params = {
        policyDocument: `{
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": "iot:*",
                "Resource": "*"
            }]
        }`,
        policyName: `${data}-${region}`
    };
    try {
        const command = new CreatePolicyCommand(params);
        return await client.send(command);
    } catch (err) {
        throw err;
    }
};

const attachPrincipalPolicy = async (data, certificateData, region) => {
    const client = new IoTClient({ region });
    const params = {
        policyName: data.policyName,
        principal: certificateData.certificateArn
    };
    try {
        const command = new AttachPolicyCommand(params);
        return await client.send(command);
    } catch (err) {
        throw err;
    }
};

const attachCertificateWithThing = async (data, certificateData, region) => {
    const client = new IoTClient({ region });
    const params = {
        principal: certificateData.certificateArn,
        thingName: data.thingName
    };
    try {
        const command = new AttachThingPrincipalCommand(params);
        return await client.send(command);
    } catch (err) {
        throw err;
    }
};

const fetchCertificatesById = async (data, region) => {
    const client = new IoTClient({ region });
    const params = { certificateId: data };
    try {
        const command = new DescribeCertificateCommand(params);
        return await client.send(command);
    } catch (err) {
        throw err;
    }
};

const fetchIoTEndpoint = async (region) => {
    const client = new IoTClient({ region });
    const params = { endpointType: 'iot:Data-ATS' };
    try {
        const command = new DescribeEndpointCommand(params);
        return await client.send(command);
    } catch (err) {
        throw err;
    }
};

const registerDeviceCert = async (region, certPem, caCertPem) => {
    const client = new IoTClient({ region });
    const params = {
        certificatePem: certPem,
        caCertificatePem: caCertPem,
        status: 'ACTIVE'
    };
    try {
        const command = new RegisterCertificateCommand(params);
        return await client.send(command);
    } catch (err) {
        console.log('======', err);
        throw err;
    }
};

const fetchCaCertificate = async (region) => {
    const client = new IoTClient({ region });
    const params = { ascendingOrder: true, pageSize: '10' };
    try {
        const listCommand = new ListCACertificatesCommand(params);
        const listResponse = await client.send(listCommand);
        const describeParams = { certificateId: listResponse.certificates[0].certificateId };
        const describeCommand = new DescribeCACertificateCommand(describeParams);
        return await client.send(describeCommand);
    } catch (err) {
        throw err;
    }
};

const getPrivateKeyToSignCert = async (region) => {
    const secretName = `${Stage}/${domainName}/iot`;
    const client = new SecretsManagerClient({ region });
    const params = { SecretId: secretName };
    try {
        const command = new GetSecretValueCommand(params);
        const response = await client.send(command);
        if ('SecretString' in response) {
            return response.SecretString;
        }
        throw new Error("SecretString not found in response");
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const encryptIoTCertificate = (certificate) => {
    const cipher = crypto.createCipher(algorithmName, secretEncryptionKeys);
    return cipher.update(certificate, 'utf8', 'hex') + cipher.final('hex');
};

const decryptIoTCertificate = (certificate) => {
    const decipher = crypto.createDecipher(algorithmName, secretEncryptionKeys);
    return decipher.update(certificate, 'hex', 'utf8') + decipher.final('utf8');
};

module.exports = {
    createThing,
    createDeviceCertificate,
    createPolicy,
    attachPrincipalPolicy,
    attachCertificateWithThing,
    fetchCertificatesById,
    fetchIoTEndpoint,
    getPrivateKeyToSignCert,
    fetchCaCertificate,
    registerDeviceCert,
    encryptIoTCertificate,
    decryptIoTCertificate
};
