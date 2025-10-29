const localEnvs = require('../config/config')
const AWS_ACCOUNT_NUMBER = process.env.awsAccountNumber || localEnvs.awsAccountNumber
const ROLE_NAME = process.env.roleName || localEnvs.roleName
const AWS_REGION = process.env.region || localEnvs.region
const { STSClient, AssumeRoleCommand } = require('@aws-sdk/client-sts');

module.exports.getStsCredentials = async (policy) => {
  policy = policy.policy.policy || policy.policy;

  const params = {
    RoleArn: `arn:aws:iam::${AWS_ACCOUNT_NUMBER}:role/${ROLE_NAME}`,
    Policy: policy,
    RoleSessionName: `session-${Date.now()}`, // A more predictable and unique session name
    DurationSeconds: 900,
  };

  try {
    const sts = new STSClient({});
    const command = new AssumeRoleCommand(params);
    const response = await sts.send(command);
    return response;
  } catch (err) {
    throw err;
  }
};