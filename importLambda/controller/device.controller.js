const { addCreateTimeStamp } = require("../utils");
const { getDb } = require("../config/db");
const { ObjectId } = require("mongodb");

const validateAndInsertDevice = async (deviceInput, CustomerID) => {
    try {
        const {
            Device, DeviceType, Description, Label, MacAddress, LocationName, ThingName, Tags
        } = deviceInput;
        if (!Device || !DeviceType || !LocationName || !MacAddress) throw new Error('Missing required fields');
        const db = await getDb();
        let location, thing, validateDevice, licenseData
        location = await db.collection('Locations').findOne({ Location: LocationName, CustomerID })
          thing = await db.collection('Things').findOne({ Thing: ThingName, CustomerID })
          validateDevice = await db.collection('Devices').findOne({
              CustomerID: CustomerID, LocationID: location?._id, Device: { $regex: `^${Device}$`, $options: 'i' }, IsDeleted: false
          })
          licenseData = await db.collection('Licenses').findOne({ CustomerID, IsActive: true, IsDeleted: false })
        if (!location) throw new Error(`Location ${LocationName} not found`);
        if (validateDevice) throw new Error('Device already exists');
        if (!licenseData || !licenseData.DevicesLimit) throw new Error('License not found');

        const deviceArray = await db.collection('Devices').find({
            CustomerID, DeviceType, IsActive: true, IsDeleted: false
        }, { DeviceType: 1 }).toArray();

        const limitObj = licenseData.DevicesLimit.find(data => data.DeviceType === DeviceType) || {};
        if (!Object.keys(limitObj).length) throw new Error('LICENSE_NOT_CONFIGURED_FOR_THIS_TYPE');
        if (deviceArray.length >= limitObj.DeviceNumber) throw new Error('LICENSE_LIMIT_THINGS');

        let newDevice = {
            Device, DeviceType, Description, Label, Enabled: true,
            MacAddress, IsActive: true, CustomerID, LocationID: location?._id,
            ThingID: thing ? thing._id : null, IsDeleted: false, Tags: Tags && Tags!== '' ? Tags?.split(',') : []
        };
        newDevice = await addCreateTimeStamp(newDevice);
        newDevice.IsBulkImport = true;
        const { insertedId } = await db.collection('Devices').insertOne(newDevice);

        if (thing) {
            const bulkOps = [
                {
                    updateOne: {
                        filter: { _id: thing._id },
                        update: { $push: { DeviceID: insertedId } }
                    }
                }
            ];

            if (thing.ThingType.toLowerCase() === 'kiosk') {
                bulkOps.push({
                    updateMany: {
                        filter: { _id: { $in: thing.DeviceID } },
                        update: { $set: { ThingID: null } }
                    }
                });
            }

            await db.collection('Things').bulkWrite(bulkOps);
        }

        return await db.collection('Devices').findOne({ _id: insertedId });
    } catch (e) {
        throw e
    }
};

module.exports = { validateAndInsertDevice };