const config = require("../config/config");
const crypto = require("crypto");

const decryptText = async (encryptedText) => {
    const algorithm = config.algorithmNameInt
    const key = config.secretEncryptionKeys
    const iv = Buffer.from(config.ivValue)
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    return decipher.update(encryptedText, 'hex', 'utf8') + decipher.final('utf8')
}

module.exports = { 
    decryptText
}