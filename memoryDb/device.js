const {getDb} = require('../publicAuth/config/db')
const collectionName = 'Devices'
const { getObjectId: ObjectId } = require("../publicAuth/helpers/objectIdConvertion");
const moment = require("../publicAuth/node_modules/moment");
const { faker } = require('../publicAuth/node_modules/@faker-js/faker');

module.exports = {
    addDevice: async (customerId, deviceName, deviceType = "printer") => {
        const db = await getDb()
        const deviceData = {
            "Device" : deviceName || faker.company.name(),
            "CustomerID" : customerId,
            "Description" : null,
            "Tags" : [ ],
            "CustomerName": faker.company.name(),
            "CreatedBy" : ObjectId.createFromHexString(),
            "CreatedAt" : moment().format(),
            "UpdatedAt" : moment().format(),
            "IsActive" : true,
            "IsDeleted" : false,
            "DeviceType": deviceType
        }
        const data = await db.collection(collectionName).insertOne(deviceData)
        deviceData._id = data.insertedId
        return {insertedId: data.insertedId, ops: [deviceData]}
    },
    getPrinterDeviceByCustomerID: async (customerId) => {
        const db = await getDb()
        const device = await db.collection(collectionName).findOne({CustomerID: ObjectId.createFromHexString(customerId), IsActive: true, IsDeleted: false, DeviceType: "printer" })
        return device
    }
}
