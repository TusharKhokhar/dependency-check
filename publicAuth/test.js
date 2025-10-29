const { getObjectId: ObjectId } = require("../publicAuth/helpers/objectIdConvertion")
const {getDb} = require("./config/db");

const updateDeviceScript = async () => {
    const db = await getDb()
    const customers = await db.collection('Customers').find({IsDeleted: false}).toArray()
    for( let cus of customers) {
        console.log('cus*****',cus);
        const usages = await db.collection('Usage').find({CustomerID: cus._id, Type : "print"}).toArray()
        console.log('Total usages: ',usages.length);
        const things = await db.collection('Things').find({CustomerID: cus._id, IsDeleted: false}).toArray()
        const thingMapping = things?.length > 0 ? things.map(th => th._id.toString()) : []
        if (thingMapping?.length > 0) {
            await processUsagesConcurrently(usages, things, thingMapping, db)
            await sleep(5000); // Pause execution for 2 seconds
            // process.exit()
        }
    }
}

async function processUsagesConcurrently(usages, things, thingMapping, db) {
    // Create an array of promises
    const promises = usages.map(async (us) => {
        let mappedThing = us.ThingID ? things[thingMapping.indexOf(us.ThingID.toString())] : null;
        const assignedDevices = mappedThing ? await db.collection('Devices').find({ _id: { $in: mappedThing.DeviceID } }).toArray() : {};
        let deviceIdMap = mappedThing?.DeviceID ? mappedThing.DeviceID.map(dev => dev.toString()) : [];

        if (deviceIdMap && us?.Print?.DeviceID && !deviceIdMap.includes(us.Print.DeviceID.toString())) {
            const finalDevice = mappedThing && assignedDevices ?
              await smartPrinting(mappedThing, assignedDevices, us, db) : null;

            if (finalDevice) {
                console.log('finalDevice name********', finalDevice.Device);
                console.log('usage id********', us._id);
                // Uncomment the following line if you want to perform the database update concurrently as well
                // await db.collection('Usages').update({ _id: us._id }, { $set: { 'Print.DeviceID': finalDevice.DeviceID, 'Print.Device': finalDevice.Device } }, { multi: false });
            }
        }
    });

    // Wait for all promises to complete
    await Promise.all(promises);
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const smartPrinting = async (thingsData, deviceList, usage, db) => {
    let deviceName
    let deviceFound = await smartPrintDeviceFinder(usage, deviceList)
    if (deviceFound && deviceFound.matches > 0) {
        deviceName = deviceFound
    } else {
        const defaultDevice = await db.collection('Devices').findOne({ _id: thingsData.DefaultDevice })
        deviceName = defaultDevice ? defaultDevice : null
    }
    return deviceName
}

const smartPrintDeviceFinder = async (printJob, deviceList) => {
    let highMatchDevices = {
        matches: 0
    }
    let printJobColor = printJob.Print.ColorType
    let printIsDuplex = printJob.Print.Duplex
    const printPaperSize = printJob.Print.PaperSize
    await deviceList.map(deviceSpecs => {
        let match = 0
        const obj = deviceSpecs
        printJobColor.toLowerCase() === 'grayscale' ? printJobColor = 'GrayScale' : printJobColor
        deviceSpecs.ColorEnabled && deviceSpecs.Color[`${printJobColor}`] === true ? match = match + 1 : null
        if (printIsDuplex) {
            printIsDuplex = 'TwoSided'
        } else {
            printIsDuplex = 'OneSided'
        }
        deviceSpecs.DuplexEnabled && deviceSpecs.Duplex[`${printIsDuplex}`] === true ? match = match + 1 : null
        deviceSpecs.PaperSizesEnabled && deviceSpecs.PaperSizes[`${printPaperSize}`] === true ? match = match + 1 : null
        console.log('Match Count: ', match)
        obj.matches = match
        if (highMatchDevices.matches < match) {
            highMatchDevices = obj
        }
    })
    return highMatchDevices
}

updateDeviceScript().then(res => {
    console.log('done');
})