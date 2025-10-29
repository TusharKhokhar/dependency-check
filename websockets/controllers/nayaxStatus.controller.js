const { TIER } = require("../constants/constants");
const { getDb, isolatedDatabase } = require('../config/db');

module.exports.getNayaxStatus = async (connectionId, parsedBody) => {
  console.log('Inside the getNayaxStatus Function: ', parsedBody)
  try {
    const { tier, transactionId, domainName, routeKey } = parsedBody
    const db = tier === TIER ? await getDb() : await isolatedDatabase(domainName)

    const data = {
      connectionId, routeKey, transactionId
    }
    await db.collection('Connections').updateOne({ connectionId }, { $set: data })
  
    return {
      statusCode: 200
    }
  } catch (error) {
    console.log(error)
    throw new Error(error)
  }
}
