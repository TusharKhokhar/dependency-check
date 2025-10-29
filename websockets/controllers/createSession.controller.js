const {getDb, isolatedDatabase} = require("../config/db");
const {iotPolicy} = require("../services/policy");
const {getStsCredentials} = require("../services/credentialsGenerator");
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')
const {fetchIoTEndpoint, publishToTopic} = require("../services/iot-handler");
const {region} = require("../config/config");
const {sendError} = require("../services/sendErrorResponse");

module.exports.createSession = async (connectionId, parsedBody) => {
     if ( !parsedBody.releaseCode ||
                !parsedBody.requestType || !parsedBody.customerId) {
                return {
                    statusCode: 400
                }
            } else {
                const instance = await getDb()
                let premDatabase = instance
                if(parsedBody.tier !== 'standard') {
                    premDatabase = await isolatedDatabase(parsedBody.domainName)
                }
                const policy = iotPolicy()
                const credentials = await getStsCredentials(policy)
                const accessParams = {
                    accessKeyId: credentials.Credentials.AccessKeyId,
                    secretAccessKey: credentials.Credentials.SecretAccessKey,
                    sessionToken: credentials.Credentials.SessionToken
                };
                let deviceData = parsedBody.deviceId ? await premDatabase.collection('Devices').findOne({_id: ObjectId.createFromHexString(parsedBody.deviceId)}) : null
                let {ChargeForUsage} = parsedBody.customerId ? await premDatabase.collection('JobLists').findOne({CustomerID: ObjectId.createFromHexString(parsedBody.customerId)}) : null
                const chargeValue = parsedBody.Charge === true || parsedBody.Charge === false ? parsedBody.Charge : ChargeForUsage
                //Logic for Printer Groups
                const endpoint = await fetchIoTEndpoint(region, accessParams)
                let accountIds = parsedBody.accountNumber ? parsedBody.accountNumber : []
                if(parsedBody.groupId && parsedBody.printerGroupId) {
                    let groupData = await premDatabase.collection('Groups').findOne({_id: ObjectId.createFromHexString(parsedBody.groupId)})
                    if(groupData && groupData.PrinterGroups){
                        let deviceIds = []
                        let fileNames = parsedBody.fileNames
                        let releaseNumber = parsedBody.releaseCode
                        let deviceName
                        let docJobList = await premDatabase.collection('PublicUploads').findOne({ReleaseCode: releaseNumber, CustomerID: ObjectId.createFromHexString(parsedBody.customerId)})
                        await groupData.PrintGroups.forEach(pri => {
                            if (pri._id.toString() === parsedBody.printerGroupId.toString() && pri.Enabled) {
                                deviceIds = pri.DeviceId
                            }
                        })
                        deviceIds = deviceIds ? deviceIds.map(id => ObjectId.createFromHexString(id)) : []
                        console.log('deviceIds: ',deviceIds);
                        const assignedDevices = await premDatabase.collection('Devices').find({ _id: { $in: deviceIds } }).toArray()
                        for(let file of docJobList.JobList){
                            if(fileNames.includes(file.NewFileNameWithExt)){
                                const deviceFound = await smartPrintDeviceFinder(file, assignedDevices)
                                const thingDataForDevice = await premDatabase.collection('Things').findOne({ _id: deviceFound.ThingID })
                                let locId = ''
                                deviceName = deviceFound.Device
                                locId = deviceFound.LocationID
                                locId = locId ? locId : parsedBody.locationId
                                const topic = `cmd/eprintit/${parsedBody.customerId}/${locId}/${thingDataForDevice.PrimaryRegion.ThingName}/${parsedBody.requestType}`
                                await sendMessageToKiosk(topic, docJobList, thingDataForDevice, deviceName, accessParams, endpoint, file.NewFileNameWithExt, connectionId, accountIds, chargeValue)
                            }
                        }
                        return {
                            statusCode: 200
                        }
                    } else {
                        await sendError(connectionId, 'Printer Groups not defined')
                        return {
                            statusCode: 200
                        }
                    }
                } else {
                    const thingData = deviceData ? await premDatabase.collection('Things').findOne({_id: deviceData.ThingID}) : {}
                    if(!thingData && !parsedBody.thingName){
                        await sendError(connectionId, 'Thing not configured')
                        return {
                            statusCode: 200
                        }
                    }
                    let thingNameParsed = parsedBody.thingName ? parsedBody.thingName : thingData.PrimaryRegion.ThingName
                    const message = {
                        SessionID: connectionId, ReleaseCode: parsedBody.releaseCode,
                        ThingName: thingNameParsed,
                        RequestType: parsedBody.requestType,
                        Device: deviceData ? deviceData.Device : '',
                        FileNames: parsedBody.fileNames ? parsedBody.fileNames : [],
                        Accounts: parsedBody.accountNumber ? parsedBody.accountNumber : [],
                        Charge: chargeValue || false
                    }
                    const topic = `cmd/eprintit/${parsedBody.customerId}/${parsedBody.locationId}/${thingNameParsed}/${parsedBody.requestType}`
                    await publishToTopic(topic, message, endpoint, accessParams)
                    await instance.collection('PublicUploads').createIndex( { 'ExpireRecord': 1 }, { expireAfterSeconds: 1800 } )
                    const data = {
                        SessionID: connectionId, Topic: parsedBody.releaseCode,
                        CustomerID: ObjectId.createFromHexString(parsedBody.customerId),
                        LocationID: ObjectId.createFromHexString(parsedBody.locationId),
                        ThingName: thingNameParsed,
                        RequestType: parsedBody.requestType,
                        Device: parsedBody.deviceId ? parsedBody.deviceId : null,
                        CreatedAt: new Date(),
                        FileNames: parsedBody.fileNames ? parsedBody.fileNames : [],
                        Accounts: parsedBody.accountNumber ? parsedBody.accountNumber : [],
                        ExpireRecord: new Date()
                    }
                    await instance.collection('ThingSessions').insertOne(data)
                    return {
                        statusCode: 200
                    }
                }
            }
}

const sendMessageToKiosk = async (topic, ifProcessedAll, thingsData, deviceName, accessParams, endpoint, file, connectionId, accountNumber, ChargeForUsage) => {
    // to be changed till here
    console.log('Topic Name: ', topic)
    // Add device as well in the json message sent
    const data = {
        ReleaseCode: ifProcessedAll.ReleaseCode,
        ThingName: thingsData.PrimaryRegion.ThingName,
        RequestType: 'printrelease',
        Device: deviceName || null,
        FileNames: file ? [file] : [],
        SessionID: connectionId,
        Accounts: accountNumber ? accountNumber : []
    }
    if (ChargeForUsage) {
        Object.assign(data, {Charge: ChargeForUsage})
    }
    console.log('Message Formed: ', data)
    await publishToTopic(topic, data, endpoint, accessParams)
}

const smartPrintDeviceFinder = async (printJob, deviceList) => {
    let highMatchDevices = {
        matches: 0
    }
    let printJobColor = printJob.Color
    let printIsDuplex = printJob.Duplex
    const printPaperSize = printJob.PaperSize
    let printOrientation = printJob.Orientation
    await deviceList.forEach(deviceSpecs => {
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
        printOrientation.toLowerCase() === 'landscape'
            ? printOrientation = 'LandScape'
            : printOrientation
        deviceSpecs.LayoutEnabled && deviceSpecs.Layout[`${printOrientation}`] === true ? match = match + 1 : null
        deviceSpecs.PaperSizesEnabled && deviceSpecs.PaperSizes[`${printPaperSize}`] === true ? match = match + 1 : null
        console.log('Match Count: ', match)
        obj.matches = match
        if (highMatchDevices.matches < match) {
            highMatchDevices = obj
        }
    })
    return highMatchDevices
}