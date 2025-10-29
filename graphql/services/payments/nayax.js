const axios = require('axios')
const crypto = require('crypto')
const { NAYAX_REQUEST_URL } = require('../../helpers/constants')
const { getNayaxSecretKey } = require('../../helpers/util')
const { Stage, domainName, region} = require('../../config/config')

const getNayaxResponse = async (nayaxInputData) => {
  try {
    const { Amount, TerminalID } = nayaxInputData
    const nayaxCredentials = await getNayaxSecretKey(region, Stage, domainName)
    const parsedCredentials = JSON.parse(nayaxCredentials)
    const TransactionId = crypto.randomBytes(64).toString('hex').slice(0, 20)
  
    const reqData = {
      TerminalId: TerminalID,
      TransactionId,
      SecretToken: parsedCredentials.token,
      Amount,
      TransactionTimeout: 60,
    }
    const response = await axios.post(NAYAX_REQUEST_URL, reqData);
    return response.data
  } catch (error) {
    console.log(error)
    throw new Error(error)
  }
}

module.exports = getNayaxResponse