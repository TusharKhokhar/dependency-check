const { mockClient } = require("aws-sdk-client-mock");
const { STSClient, AssumeRoleCommand } = require("@aws-sdk/client-sts");
const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");
const {
  IoTClient,
  CreateThingCommand,
  ListCACertificatesCommand,
  DescribeCACertificateCommand,
  CreatePolicyCommand,
  AttachPrincipalPolicyCommand,
  AttachThingPrincipalCommand,
  RegisterCertificateCommand,
  SearchIndexCommand,
} = require("@aws-sdk/client-iot");
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

// Create a SINGLE mock instance globally
const iotMock = mockClient(IoTClient);
const stsMock = mockClient(STSClient);
const ssmClientMock = mockClient(SecretsManagerClient);
const sesMock = mockClient(SESv2Client);

const mockGetStsCredentials = async () => {
  const data = {
    Credentials: {
      AccessKeyId: "mockAccessKey",
      SecretAccessKey: "mockSecretAccessKey",
      SessionToken: "mockSessionToken",
    },
  };
  stsMock.on(AssumeRoleCommand).resolves(data);
  const sts = new STSClient({});
  return await sts.send(new AssumeRoleCommand({}));
};

const mockCreateThingCommand = async () => {
  const data = { thingName: "testThing" };
  iotMock.on(CreateThingCommand).resolves(data);
  const iot = new IoTClient({});
  return await iot.send(new CreateThingCommand(data));
};

const mockListCACertificate = async () => {
  const certList = {
    certificates: [{ certificateId: "certId" }],
  };
  const certParams = {
    certificateId: certList.certificates[0].certificateId,
  };
  const describeCert = {
    certificateDescription: {
      certificatePem:
        "-----BEGIN CERTIFICATE----- encoded certificate data -----END CERTIFICATE----- ",
    },
  };

  iotMock.on(ListCACertificatesCommand).resolves(certList);
  iotMock.on(DescribeCACertificateCommand).resolves(describeCert);

  const iot = new IoTClient({});

  await iot.send(new ListCACertificatesCommand({}));

  const describeCerts = await iot.send(
    new DescribeCACertificateCommand(certParams)
  );

  return describeCerts;
};

const mockGetSecretManagerKey = async (secretName = null) => {
  let secretKey;
  if (secretName === "atrium") {
    secretKey = {
      SecretString: JSON.stringify({
        clientId: "mock-client-id",
        secretKey: "mock-secret-key",
      }),
    };
  } else {
    secretKey = {
      SecretString:
        "-----BEGIN CERTIFICATE----- encoded certificate data -----END CERTIFICATE-----",
    };
  }

  ssmClientMock.on(GetSecretValueCommand).resolves(secretKey);
  const ssmClient = new SecretsManagerClient({});
  const secretKeyName = secretName ? secretName : `dev/test/iot`;

  await ssmClient.send(new GetSecretValueCommand({ SecretId: secretKeyName }));

  return secretKey;
};

const mockRegisterDeviceCert = async () => {
  const mockResponse = {
    certificateArn: "arn:aws:iot:region:accountId:cert/testCertificateArn",
    certificateId: "testCertificateId",
  };

  // Mock the RegisterCertificateCommand response
  iotMock.on(RegisterCertificateCommand).resolves(mockResponse);

  const iot = new IoTClient({});
  const params = {
    certificatePem:
      "-----BEGIN CERTIFICATE-----\nmockCertData\n-----END CERTIFICATE-----",
    caCertificatePem:
      "-----BEGIN CERTIFICATE-----\nmockCaCertData\n-----END CERTIFICATE-----",
    status: "ACTIVE",
  };

  const response = await iot.send(new RegisterCertificateCommand(params));

  return response;
};

const mockCreatePolicy = async () => {
  const policyData = {
    policyName: "testPolicy",
    policyDocument: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: "iot:Connect",
          Resource: "*",
        },
      ],
    }),
    certificateArn: "arn:aws:iot:region:accountId:cert/testCertificateArn",
  };
  iotMock.on(CreatePolicyCommand).resolves(policyData);
  const iot = new IoTClient({});
  return await iot.send(new CreatePolicyCommand({}));
};

const mockAttachPrincipalPolicy = async () => {
  const policyData = {};
  iotMock.on(AttachPrincipalPolicyCommand).resolves(policyData);
  const iot = new IoTClient({});
  return await iot.send(new AttachPrincipalPolicyCommand({}));
};

const mockAttachCertificateWithThing = async () => {
  const policyData = {};
  iotMock.on(AttachThingPrincipalCommand).resolves(policyData);
  const iot = new IoTClient({});
  return await iot.send(new AttachThingPrincipalCommand({}));
};

const mockThingDetails = async () => {
  const mockResponse = {
    things: [
      {
        connectivity: {
          connected: true, // Mocked online status
          disconnectReason: "Network issue", // Mocked reason
        },
      },
    ],
  };
  iotMock.on(SearchIndexCommand).resolves(mockResponse);
  const iot = new IoTClient({});
  const params = {
    queryString: `thingName:testThing`, // Mocked thing name
  };
  // Call the mock function
  const response = await iot.send(new SearchIndexCommand(params));

  return response;
};

const mockSESv2Client = async () => {
  sesMock.reset();
  sesMock.on(SendEmailCommand).resolves({
    MessageId: 'mocked-message-id'
  });
  return "";
};

module.exports = {
  mockGetStsCredentials,
  mockCreateThingCommand,
  mockListCACertificate,
  mockGetSecretManagerKey,
  mockCreatePolicy,
  mockAttachPrincipalPolicy,
  mockAttachCertificateWithThing,
  mockRegisterDeviceCert,
  mockThingDetails,
  mockSESv2Client
};
