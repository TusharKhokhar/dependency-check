const {iotPolicy} = require("../services/policy");
const {getStsCredentials} = require("../services/credentialsGenerator");
const {isolatedDatabase, getDb} = require("../config/db");
const {thingDetails} = require("../services/iot-handler");

module.exports.getOnlineStatus = async (accessKey, parsedBody, customerId) => {
    try {
        let {
            device
        } = parsedBody
        if (!device) {
            return 'Invalid Device Name'
        }
        let db = await getDb()
        const customerData = await db.collection('Customers').findOne({_id: customerId, IsDeleted: false, IsActive: true})
        if (customerData && customerData.Tier !== 'standard') {
            db = await isolatedDatabase(customerData.DomainName)
        }
        const deviceData = await db.collection('Devices').findOne({Device: device, CustomerID: customerId, IsDeleted: false})
        if (!deviceData) {
            return 'Invalid Device Name'
        } else {
            const thingData = await db.collection('Things').findOne({_id: deviceData?.ThingID, CustomerID: customerId})
            if (!thingData) {
                return 'Device is not associated with any thing'
            }
            const policy = iotPolicy()
            const credentials = await getStsCredentials(policy)
            const accessParams = {
                accessKeyId: credentials.Credentials.AccessKeyId,
                secretAccessKey: credentials.Credentials.SecretAccessKey,
                sessionToken: credentials.Credentials.SessionToken
            }
            const currentStatus = await thingDetails(thingData, accessParams)
            const onlineStatus = currentStatus.things[0] && currentStatus.things[0].connectivity &&
            currentStatus.things[0].connectivity.connected
              ? currentStatus.things[0].connectivity.connected
              : false
            return onlineStatus === true ? 'online' : 'offline'
        }
    } catch (e) {
        console.log('error: ',e);
        return 'something went wrong'
    }
}