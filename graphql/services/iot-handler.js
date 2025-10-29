const { IoTClient, CreateThingCommand, CreateKeysAndCertificateCommand, CreatePolicyCommand,
  AttachPrincipalPolicyCommand, AttachThingPrincipalCommand, DescribeCertificateCommand,
  DescribeEndpointCommand, RegisterCertificateCommand, ListCACertificatesCommand,
  DescribeCACertificateCommand, UpdateCertificateCommand, DetachPolicyCommand,
  DeleteThingCommand, DetachThingPrincipalCommand, DeleteCertificateCommand } = require("@aws-sdk/client-iot");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const config = require('../config/config');
const crypto = require("crypto");

// Function to create a thing
const createThing = async (data, region, accessParams) => {
  const iotClient = new IoTClient({
    region: region,
    credentials: accessParams
  })
  const params = {
    thingName: data.iotThingName
  };
  try {
    return await iotClient.send(new CreateThingCommand(params));
  } catch (err) {
    console.error("Error creating thing:", err);
    throw err;
  }
};

// Function to create device certificate
const createDeviceCertificate = async (region, accessParams) => {
  const params = {
    setAsActive: true
  };
  const iotClient = new IoTClient({
    region: region,
    credentials: accessParams
  })
  try {
    return await iotClient.send(new CreateKeysAndCertificateCommand(params));
  } catch (err) {
    console.error("Error creating device certificate:", err);
    throw err;
  }
};

// Function to create policy
const createPolicy = async (data, iotData, region, accessParams) => {
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
  const iotClient = new IoTClient({
    region: region,
    credentials: accessParams
  })
  try {
    return await iotClient.send(new CreatePolicyCommand(params));
  } catch (err) {
    console.error("Error creating policy:", err);
    throw err;
  }
};

// Function to attach principal to policy
const attachPrincipalPolicy = async (data, certificateData, region, accessParams)  => {
  const params = {
    policyName: data.policyName,
    principal: certificateData.certificateArn
  };
  const iotClient = new IoTClient({
    region: region,
    credentials: accessParams
  })
  try {
    return await iotClient.send(new AttachPrincipalPolicyCommand(params));
  } catch (err) {
    console.error("Error attaching principal to policy:", err);
    throw err;
  }
};

// Function to attach certificate with thing
const attachCertificateWithThing = async (data, certificateData, region, accessParams) => {
  const params = {
    principal: certificateData.certificateArn,
    thingName: data.thingName
  };
  try {
    const iotClient = new IoTClient({
      region: region,
      credentials: accessParams
    })
    return await iotClient.send(new AttachThingPrincipalCommand(params));
  } catch (err) {
    console.error("Error attaching certificate with thing:", err);
    throw err;
  }
};

// Function to fetch certificates by ID
const fetchCertificatesById = async (data, region, accessParams)  => {
  const params = {
    certificateId: data
  };
  try {
    const iotClient = new IoTClient({
      region: region,
      credentials: accessParams
    })
    return await iotClient.send(new DescribeCertificateCommand(params));
  } catch (err) {
    console.error("Error fetching certificate by ID:", err);
    throw err;
  }
};

// Function to fetch IoT endpoint
const fetchIoTEndpoint = async (region, accessParams)  => {
  const params = {
    endpointType: 'iot:Data-ATS'
  };
  const iotClient = new IoTClient({
    region: region,
    credentials: accessParams
  })
  try {
    return await iotClient.send(new DescribeEndpointCommand(params));
  } catch (err) {
    console.error("Error fetching IoT endpoint:", err);
    throw err;
  }
};

// Function to register device certificate
const registerDeviceCert = async (region, accessParams, certPem, caCertPem) => {
  const params = {
    certificatePem: certPem,
    caCertificatePem: caCertPem,
    status: 'ACTIVE'
  };
  try {
    const iotClient = new IoTClient({
      region: region,
      credentials: accessParams
    })
    return await iotClient.send(new RegisterCertificateCommand(params));
  } catch (err) {
    console.error("Error registering device certificate:", err);
    throw err;
  }
};

// Function to fetch CA certificate
const fetchCaCertificate = async (region, accessParams) => {
  const params = {
    ascendingOrder: true,
    pageSize: '10'
  };
  try {
    const iotClient = new IoTClient({
      region: region,
      credentials: accessParams
    })
    const listData = await iotClient.send(new ListCACertificatesCommand(params));
    if (listData.certificates.length > 0) {
      const certParams = {
        certificateId: listData.certificates[0].certificateId
      };
      return await iotClient.send(new DescribeCACertificateCommand(certParams));
    } else {
      throw new Error("No CA certificates found.");
    }
  } catch (err) {
    console.error("Error fetching CA certificate:", err);
    throw err;
  }
};

// Function to encrypt IoT certificate
const encryptIoTCertificate = async (certificate) => {
  try {
    const algorithm = config.algorithmName;
    const key = config.secretEncryptionKeysIoT;
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(certificate, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (err) {
    console.error("Error encrypting IoT certificate:", err);
    throw err;
  }
};

// Function to decrypt IoT certificate
const decryptIoTCertificate = async (encryptedCertificate) => {
  try {
    const algorithm = config.algorithmName;
    const key = config.secretEncryptionKeysIoT;
    const decipher = crypto.createDecipher(algorithm, key)
    let decrypted = decipher.update(encryptedCertificate, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error("Error decrypting IoT certificate:", err);
    throw err;
  }
};

// Function to get private key to sign certificate
const getPrivateKeyToSignCert = async (region) => {
  try {
    const secretsManagerClient = new SecretsManagerClient({
      region: region
    });
    const secretName = `${config.Stage}/${config.domainName}/iot`;
    const data = await secretsManagerClient.send(new GetSecretValueCommand({ SecretId: secretName }));
    if ('SecretString' in data) {
      return data.SecretString
    } else {
      throw new Error("Secret value not found.");
    }
  } catch (err) {
    console.error("Error getting private key to sign certificate:", err);
    throw err;
  }
};

// Function to delete IoT thing
const deleteIoTThing = async (accessParams, thingName, region)  => {
  const params = {
    thingName: thingName
  };
  const iotClient = new IoTClient({
    region: region,
    credentials: accessParams
  })
  try {
    return await iotClient.send(new DeleteThingCommand(params));
  } catch (err) {
    console.error("Error deleting IoT thing:", err);
    throw err;
  }
};

// Function to detach thing principal policy
const deAttachThingPrincipalPolicy = async (certificateArn, region, accessParams, thingName)  => {
  const params = {
    principal: certificateArn,
    thingName: thingName
  };
  try {
    const iotClient = new IoTClient({
      region: region,
      credentials: accessParams
    })
    return await iotClient.send(new DetachThingPrincipalCommand(params));
  } catch (err) {
    console.error("Error detaching thing principal policy:", err);
    throw err;
  }
};

// Function to delete certificate
const deleteCertificate = async (certId, region, accessParams)  => {
  const params = {
    certificateId: certId
  };
  try {
    const iotClient = new IoTClient({
      region: region,
      credentials: accessParams
    })
    return await iotClient.send(new DeleteCertificateCommand(params));
  } catch (err) {
    console.error("Error deleting certificate:", err);
    throw err;
  }
};

// Function to deactivate certificate (continued)
const deactivateCertificate = async (certId, region, accessParams)  => {
  const params = {
    certificateId: certId,
    newStatus: "INACTIVE"
  };
  try {
    const iotClient = new IoTClient({
      region: region,
      credentials: accessParams
    })
    return await iotClient.send(new UpdateCertificateCommand(params));
  } catch (err) {
    console.error("Error deactivating certificate:", err);
    throw err;
  }
};

// Function to detach policy
const detachPolicy = async (policyName, region, accessParams, certId)  => {
  const params = {
    policyName: policyName,
    target: certId
  };
  try {
    const iotClient = new IoTClient({
      region: region,
      credentials: accessParams
    })
    return await iotClient.send(new DetachPolicyCommand(params));
  } catch (err) {
    console.error("Error detaching policy:", err);
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
  detachPolicy
};