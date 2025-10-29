const { getDb } = require('../config/db')

// activation codes Model
const ActivationCodes = {}

ActivationCodes.activationCodeSearch = async (activationCode) => {
  const db = await getDb()
  return await db.collection('ActivationCodes').findOneAndDelete({ActivationCode: activationCode})
}

module.exports = ActivationCodes
