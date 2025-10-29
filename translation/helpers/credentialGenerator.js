const { STSClient, AssumeRoleCommand } = require("@aws-sdk/client-sts");
const config = require("../config/config");
const AWS_ACCOUNT_NUMBER = config.awsAccountNumber;
const ROLE_NAME = config.roleName;

const stsClient = new STSClient({
  region: config.region,
});

module.exports.getStsCredentials = async (policy) => {
  const params = {
    RoleArn: `arn:aws:iam::${AWS_ACCOUNT_NUMBER}:role/${ROLE_NAME}`,
    Policy: policy.policy,
    RoleSessionName: Date.now().toString(),
  };

  try {
    const command = new AssumeRoleCommand(params);
    return await stsClient.send(command);
  } catch (error) {
    throw error;
  }
};
