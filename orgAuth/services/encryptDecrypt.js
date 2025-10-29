const config = require("../config/config");
const crypto = require("crypto");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

const encryptText = async (text) => {
    const algorithm = config.algorithmNameInt
    const key = config.secretEncryptionKeys
    const iv = Buffer.from(config.ivValue)
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    return cipher.update(text, 'utf8', 'hex') + cipher.final('hex'); // encrypted text
}

const decryptText = async (encryptedText) => {
    const algorithm = config.algorithmNameInt
    const key = config.secretEncryptionKeys
    const iv = Buffer.from(config.ivValue)
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    return decipher.update(encryptedText, 'hex', 'utf8') + decipher.final('utf8')
}

const getPrivateKeyToSignCert = async (region) => {
  try {
    const secretName = `${config.Stage}/${config.domainName}/cert`;
    const client = new SecretsManagerClient({ region });
    const params = { SecretId: secretName };
    const command = new GetSecretValueCommand(params);
    const response = await client.send(command);
    if ("SecretString" in response) {
      return response.SecretString;
    }
    log.error("getPrivateKeyToSignCert: SecretString not found in response")
    throw new Error("SecretString not found in response");
  } catch (e) {
    log.error("Error in getPrivateKeyToSignCert", e)
    throw e;
  }
};

module.exports = {
    encryptText, decryptText, getPrivateKeyToSignCert
}