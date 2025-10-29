const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const {getDb} = require("./config/db");

const SECRET_NOT_FOUND = 'SecretString not found in data';

const addCreateTimeStamp = (data, creater) => {
    const nowUtc = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), new Date().getUTCHours(), new Date().getUTCMinutes(), new Date().getUTCSeconds()));
    data.CreatedAt = nowUtc;
    data.UpdatedAt = nowUtc;
    data.IsActive = true;
    data.IsDeleted = false;
    if (creater) data.CreatedBy = creater;
    return data;
};

const getDatabase = async () => await getDb();

const getIamCredentials = async (region, stage, domainName) => {
    const secretName = `${stage}/${domainName}/iam`;
    const client = new SecretsManagerClient({ region });
    try {
        const data = await client.send(new GetSecretValueCommand({ SecretId: secretName }));
        if ('SecretString' in data) return data.SecretString;
        throw new Error(SECRET_NOT_FOUND);
    } catch (err) {
        console.error(err);
        throw err;
    }
};

function escapeRegex(string) {
  if (typeof string !== 'string') {
    return '';
  }
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
    addCreateTimeStamp,
    getDatabase,
    getIamCredentials,
    escapeRegex
};