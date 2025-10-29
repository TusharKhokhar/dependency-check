const { mockClient } = require("aws-sdk-client-mock");
const { STSClient, AssumeRoleCommand } = require("@aws-sdk/client-sts");

const stsMock = mockClient(STSClient);

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

  const getStsCredentialsResult = await sts.send(new AssumeRoleCommand(data));
  return getStsCredentialsResult;
};

module.exports = {
  mockGetStsCredentials,
};
