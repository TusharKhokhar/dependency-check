const { getDb } = require("./config/db");
const {validateAndInsertDevice} = require("./controller/device.controller");
const {validateAndInsertThing} = require("./controller/thing.controlller");
const {formatLocation} = require("./controller/location.controller");
const {validateAndInsertAccount} = require("./controller/account.controller");

const addLocations = async (locations, customerId) => {
    const db = await getDb();
    const failedLocations = [];
    const validLocations = [];
    for (const location of locations) {
        const formattedLocation = await formatLocation(location, customerId)
        const existingLocation = await db.collection('Locations').findOne({ Location: location.Location,
            CustomerID: customerId, IsDeleted: false });
        if (existingLocation) {
            location.Error = 'Location already exists';
            failedLocations.push(location);
        } else if (!location.Location || location.Location === '') {
            location.Error = 'Location name is required';
            failedLocations.push(location);
        } else if (!location.State ||  !location.Address || !location.City || !location.State ||
          !location.Country || !location.ZipCode) {
            location.Error = 'Missing required fields';
            failedLocations.push(location);
        } else if (!formattedLocation.Latitude) {
            location.Error = 'Address could not be found';
            failedLocations.push(location);
        } else {
            formattedLocation.IsBulkImport = true;
            validLocations.push(formattedLocation);
        }
    }
    if (validLocations.length > 0) {
        await db.collection('Locations').insertMany(validLocations);
        await db.collection('Locations').createIndex({ Coordinates: '2dsphere' })

    }
    return failedLocations;
};

const addDevices = async (devices, customerId) => {
    const failed = [];
    for (const device of devices) {
        try {
            await validateAndInsertDevice(device, customerId);
        } catch (error) {
            console.error('Error adding device:', error)
            device.Error = error.toString()
            failed.push(device);
        }
    }
    return failed;
};

const addThings = async (things, customerId) => {
    const failed = [];
    for (const thing of things) {
        try {
            await validateAndInsertThing(thing, customerId);
        } catch (error) {
            thing.Error = error.toString();
            failed.push(thing);
        }
    }
    return failed;
};

const addAccounts = async (accounts, customerId) => {
    const failed = [];
    for (const account of accounts) {
        try {
            await validateAndInsertAccount(account, customerId);
        } catch (error) {
            account.Error = error.toString();
            failed.push(account);
        }
    }
    return failed;
};

module.exports = { addLocations, addDevices, addThings, addAccounts };
