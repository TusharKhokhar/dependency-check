const { IoTClient, CreateThingCommand, CreateKeysAndCertificateCommand, CreatePolicyCommand,
  AttachPrincipalPolicyCommand, AttachThingPrincipalCommand, DescribeCertificateCommand,
  DescribeEndpointCommand, RegisterCertificateCommand, ListCACertificatesCommand,
  DescribeCACertificateCommand, UpdateCertificateCommand, DetachPolicyCommand,
  DeleteThingCommand, DetachThingPrincipalCommand, DeleteCertificateCommand } = require("@aws-sdk/client-iot");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const config = require('../config/config');
const crypto = require("crypto");

const STATUS_ACTIVE = 'ACTIVE';
const STATUS_INACTIVE = 'INACTIVE';
const NO_CA_CERTIFICATES_FOUND = 'No CA certificates found.';
const ERROR_CREATING_THING = 'Error creating thing:';
const ERROR_CREATING_DEVICE_CERTIFICATE = 'Error creating device certificate:';
const ERROR_CREATING_POLICY = 'Error creating policy:';
const ERROR_ATTACHING_PRINCIPAL_POLICY = 'Error attaching principal to policy:';
const ERROR_ATTACHING_CERTIFICATE = 'Error attaching certificate with thing:';
const ERROR_FETCHING_CERTIFICATE = 'Error fetching certificate by ID:';
const ERROR_FETCHING_ENDPOINT = 'Error fetching IoT endpoint:';
const ERROR_REGISTERING_CERTIFICATE = 'Error registering device certificate:';
const ERROR_FETCHING_CA_CERTIFICATE = 'Error fetching CA certificate:';
const ERROR_ENCRYPTING_CERTIFICATE = 'Error encrypting IoT certificate:';
const ERROR_DECRYPTING_CERTIFICATE = 'Error decrypting IoT certificate:';
const ERROR_DELETING_THING = 'Error deleting IoT thing:';
const ERROR_DETACHING_POLICY = 'Error detaching policy:';
const ERROR_DEACTIVATING_CERTIFICATE = 'Error deactivating certificate:';
const ERROR_DELETING_CERTIFICATE = 'Error deleting certificate:';

const createIoTClient = (region, accessParams) => new IoTClient({ region, credentials: accessParams });

const createThing = async (data, region, accessParams) => {
  const iotClient = createIoTClient(region, accessParams);
  const params = { thingName: data.iotThingName };
  try {
    return await iotClient.send(new CreateThingCommand(params));
  } catch (err) {
    console.error(ERROR_CREATING_THING, err);
    throw err;
  }
};

const createDeviceCertificate = async (region, accessParams) => {
  const iotClient = createIoTClient(region, accessParams);
  const params = { setAsActive: true };
  try {
    return await iotClient.send(new CreateKeysAndCertificateCommand(params));
  } catch (err) {
    console.error(ERROR_CREATING_DEVICE_CERTIFICATE, err);
    throw err;
  }
};

const createPolicy = async (data, iotData, region, accessParams) => {
  const iotClient = createIoTClient(region, accessParams);
  const params = {
    policyDocument: `{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Action": "iot:Connect",
        "Resource": "arn:aws:iot:${region}:${config.awsAccountNumber}:client/${iotData.thingName}"
      },
      {
        "Effect": "Allow",
        "Action": "iot:Subscribe",
        "Resource": "arn:aws:iot:${region}:${config.awsAccountNumber}:topicfilter/cmd/+/${data.CustomerID}/+/${iotData.thingName}/+"
      },
      {
        "Effect": "Allow",
        "Action": "iot:Publish",
        "Resource": "arn:aws:iot:${region}:${config.awsAccountNumber}:topic/cmd/*/${data.CustomerID}/*/${iotData.thingName}/*"
      },
      {
        "Effect": "Allow",
        "Action": "iot:Receive",
        "Resource": "arn:aws:iot:${region}:${config.awsAccountNumber}:topic/cmd/*/${data.CustomerID}/*/${iotData.thingName}/*"
      }]
    }`,
    policyName: `${data._id}-iot-thing`
  };
  try {
    return await iotClient.send(new CreatePolicyCommand(params));
  } catch (err) {
    console.error(ERROR_CREATING_POLICY, err);
    throw err;
  }
};

const attachPrincipalPolicy = async (data, certificateData, region, accessParams) => {
  const iotClient = createIoTClient(region, accessParams);
  const params = { policyName: data.policyName, principal: certificateData.certificateArn };
  try {
    return await iotClient.send(new AttachPrincipalPolicyCommand(params));
  } catch (err) {
    console.error(ERROR_ATTACHING_PRINCIPAL_POLICY, err);
    throw err;
  }
};

const attachCertificateWithThing = async (data, certificateData, region, accessParams) => {
  const iotClient = createIoTClient(region, accessParams);
  const params = { principal: certificateData.certificateArn, thingName: data.thingName };
  try {
    return await iotClient.send(new AttachThingPrincipalCommand(params));
  } catch (err) {
    console.error(ERROR_ATTACHING_CERTIFICATE, err);
    throw err;
  }
};

const fetchCertificatesById = async (data, region, accessParams) => {
  const iotClient = createIoTClient(region, accessParams);
  const params = { certificateId: data };
  try {
    return await iotClient.send(new DescribeCertificateCommand(params));
  } catch (err) {
    console.error(ERROR_FETCHING_CERTIFICATE, err);
    throw err;
  }
};

const fetchIoTEndpoint = async (region, accessParams) => {
  const iotClient = createIoTClient(region, accessParams);
  const params = { endpointType: 'iot:Data-ATS' };
  try {
    return await iotClient.send(new DescribeEndpointCommand(params));
  } catch (err) {
    console.error(ERROR_FETCHING_ENDPOINT, err);
    throw err;
  }
};

const registerDeviceCert = async (region, accessParams, certPem, caCertPem) => {
  const iotClient = createIoTClient(region, accessParams);
  const params = { certificatePem: certPem, caCertificatePem: caCertPem, status: STATUS_ACTIVE };
  try {
    return await iotClient.send(new RegisterCertificateCommand(params));
  } catch (err) {
    console.error(ERROR_REGISTERING_CERTIFICATE, err);
    throw err;
  }
};

const fetchCaCertificate = async (region, accessParams) => {
  const iotClient = createIoTClient(region, accessParams);
  const params = { ascendingOrder: true, pageSize: '10' };
  try {
    const listData = await iotClient.send(new ListCACertificatesCommand(params));
    if (listData.certificates.length > 0) {
      const certParams = { certificateId: listData.certificates[0].certificateId };
      return await iotClient.send(new DescribeCACertificateCommand(certParams));
    } else {
      throw new Error(NO_CA_CERTIFICATES_FOUND);
    }
  } catch (err) {
    console.error(ERROR_FETCHING_CA_CERTIFICATE, err);
    throw err;
  }
};

const encryptIoTCertificate = async (certificate) => {
  try {
    const algorithm = config.algorithmName;
    const key = config.secretEncryptionKeysIoT;
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(certificate, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (err) {
    console.error(ERROR_ENCRYPTING_CERTIFICATE, err);
    throw err;
  }
};

const decryptIoTCertificate = async (encryptedCertificate) => {
  try {
    const algorithm = config.algorithmName;
    const key = config.secretEncryptionKeysIoT;
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encryptedCertificate, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error(ERROR_DECRYPTING_CERTIFICATE, err);
    throw err;
  }
};

const getPrivateKeyToSignCert = async (region) => {
  const secretsManagerClient = new SecretsManagerClient({ region });
  const secretName = `${config.Stage}/${config.domainName}/iot`;
  try {
    const data = await secretsManagerClient.send(new GetSecretValueCommand({ SecretId: secretName }));
    if ('SecretString' in data) {
      return data.SecretString;
    } else {
      throw new Error('Secret value not found.');
    }
  } catch (err) {
    console.error('Error getting private key to sign certificate:', err);
    throw err;
  }
};

const getApiKey = async (region) => {
  const secretsManagerClient = new SecretsManagerClient({ region });
  const secretName = `${config.Stage}/${config.domainName}/apikeys`;
  try {
    const data = await secretsManagerClient.send(new GetSecretValueCommand({ SecretId: secretName }));
    if ('SecretString' in data) {
      return JSON.parse(data.SecretString);
    } else {
      throw new Error('Secret value not found.');
    }
  } catch (err) {
    console.error('Error getting private key to sign certificate:', err);
    throw err;
  }
};

const deleteIoTThing = async (accessParams, thingName, region) => {
  const iotClient = createIoTClient(region, accessParams);
  const params = { thingName };
  try {
    return await iotClient.send(new DeleteThingCommand(params));
  } catch (err) {
    console.error(ERROR_DELETING_THING, err);
    throw err;
  }
};

const deAttachThingPrincipalPolicy = async (certificateArn, region, accessParams, thingName) => {
  const iotClient = createIoTClient(region, accessParams);
  const params = { principal: certificateArn, thingName };
  try {
    return await iotClient.send(new DetachThingPrincipalCommand(params));
  } catch (err) {
    console.error(ERROR_DETACHING_POLICY, err);
    throw err;
  }
};

const deleteCertificate = async (certId, region, accessParams) => {
  const iotClient = createIoTClient(region, accessParams);
  const params = { certificateId: certId };
  try {
    return await iotClient.send(new DeleteCertificateCommand(params));
  } catch (err) {
    console.error(ERROR_DELETING_CERTIFICATE, err);
    throw err;
  }
};

const deactivateCertificate = async (certId, region, accessParams) => {
  const iotClient = createIoTClient(region, accessParams);
  const params = { certificateId: certId, newStatus: STATUS_INACTIVE };
  try {
    return await iotClient.send(new UpdateCertificateCommand(params));
  } catch (err) {
    console.error(ERROR_DEACTIVATING_CERTIFICATE, err);
    throw err;
  }
};

const detachPolicy = async (policyName, region, accessParams, certId) => {
  const iotClient = createIoTClient(region, accessParams);
  const params = { policyName, target: certId };
  try {
    return await iotClient.send(new DetachPolicyCommand(params));
  } catch (err) {
    console.error(ERROR_DETACHING_POLICY, err);
    throw err;
  }
};

const getIamCredentials = async (region, stage, domainName) => {
  const secretName = `${stage}/${domainName}/iam`;
  const client = new SecretsManagerClient({ region });
  try {
    const data = await client.send(new GetSecretValueCommand({ SecretId: secretName }));
    if ('SecretString' in data) {
      return data.SecretString;
    } else {
      throw new Error('Secret value not found.');
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = {
  createThing,
  createDeviceCertificate,
  createPolicy,
  attachPrincipalPolicy,
  attachCertificateWithThing,
  fetchCertificatesById,
  fetchIoTEndpoint,
  registerDeviceCert,
  fetchCaCertificate,
  encryptIoTCertificate,
  decryptIoTCertificate,
  getPrivateKeyToSignCert,
  deleteIoTThing,
  deAttachThingPrincipalPolicy,
  deleteCertificate,
  deactivateCertificate,
  detachPolicy,
  getIamCredentials,
  getApiKey
};