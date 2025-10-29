const {getDb, switchDb} = require("./config/db");
const {iotPolicy} = require("./tokenVendingMachine/policyTemplates");
const {getStsCredentials} = require("./helpers/credentialGenerator");
const {retrieveEndpoint, publishToTopic, onlineStatus} = require("./services/iot-handler");
const {region} = require("./config/config");
const {ObjectId} = require('mongodb')

module.exports.handler = async (req, res) => {
    process.exit(0)
    let date = new Date();
    let now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
      date.getUTCDate(), date.getUTCHours(),
      date.getUTCMinutes(), date.getUTCSeconds());
    console.log('Current time: ',new Date(now_utc));
    console.log('Querying for records older than or equal to: ',new Date(new Date(now_utc).getTime() - 300000));
    const db = await getDb()
    const premiumCustomers = await db.collection('Customers').find({Tier: 'premium', IsDeleted: false, IsActive: true}).toArray()
    const standardCustomers = await db.collection('Customers').find({Tier: 'standard', IsDeleted: false, IsActive: true}).toArray()
    let licenseInfo = await db.collection('Licenses').find({RegisteredTo: {$gte: new Date(now_utc)}, IsDeleted: false, IsActive: true}).toArray()
    licenseInfo = await licenseInfo.map(license => license.CustomerID.toString())
    console.log('licensed ids: ',licenseInfo);
    if(premiumCustomers && premiumCustomers.length > 0){
        for (let customer of standardCustomers) {
            if (licenseInfo.includes(customer._id.toString())) {
                console.log(customer, licenseInfo)
                await runResendJob(db, now_utc, licenseInfo, customer._id)
            }
        }
        for(let customerPre of premiumCustomers) {
            console.log('customer details: ',customerPre);
            if (licenseInfo.includes(customerPre._id.toString())){
                let premDb = await switchDb(customerPre.DomainName)
                if (licenseInfo.includes(customerPre._id.toString())) {
                    await runResendJob(premDb, now_utc, licenseInfo, customerPre._id)
                }
            }
        }
    } else {
        for (let customer of standardCustomers) {
            if (licenseInfo.includes(customer._id.toString())) {
                console.log(customer, licenseInfo)
                await runResendJob(db, now_utc, licenseInfo, customer._id)
            }
        }
    }
}

let runResendJob = async (db, now_utc, licenseInfo, customerId) => {
    const publicUploadsCollection = db.collection('PublicUploads')
    const resendJobList = await publicUploadsCollection.aggregate([
        {
            $match: {
                CustomerID: customerId,
                JobExpired: false,
                IsPrinted: false,
                AutomaticPrintDelivery: true,
                CreatedAt: {$lte: new Date(new Date(now_utc).getTime() - 300000)}
            }
        }
    ]).sort({_id: 1})
      .toArray()
    for(let job of resendJobList){
        await sendJobToKiosk(db, job, job.CustomerID)
    }
}

let sendJobToKiosk = async (db, dataSet, customerId) => {
    const Things = db.collection('Things')
    const JobLists = db.collection('JobLists')
    if (!dataSet.LocationID) {
        dataSet.LocationID = await JobLists.findOne({
            CustomerID: ObjectId.createFromHexString(customerId)
        })
        dataSet.LocationID = dataSet.LocationID ? dataSet.LocationID.DefaultAutomaticDeliveryLocation : false
    }
    let thingsData = customerId && dataSet.LocationID ? await Things.findOne({
        CustomerID: ObjectId.createFromHexString(customerId),
        LocationID: dataSet.LocationID,
        ThingType: 'print delivery station'
    }) : false
    if (thingsData) {
        const topic = `cmd/eprintit/${customerId}/${thingsData.LocationID}/${thingsData.PrimaryRegion.ThingName}/printdelivery`
        console.log('message published to topic: ',topic);
        const data = {
            ReleaseCode: dataSet.ReleaseCode,
            ThingName: thingsData.PrimaryRegion.ThingName,
            RequestType: 'printdelivery'
        }
        const policy = iotPolicy()
        const credentials = await getStsCredentials(policy)
        const accessParams = {
            accessKeyId: credentials.Credentials.AccessKeyId,
            secretAccessKey: credentials.Credentials.SecretAccessKey,
            sessionToken: credentials.Credentials.SessionToken
        }
        const endpoint = await retrieveEndpoint(region, accessParams)
        const currentStatus = await onlineStatus(thingsData, accessParams)
        console.log('currentStatus********',currentStatus)
        let statusOfThing = currentStatus.things[0] && currentStatus.things[0].connectivity
        && currentStatus.things[0].connectivity.connected?
          currentStatus.things[0].connectivity.connected : false
        if(statusOfThing){
            console.log('resending job...');
            await publishToTopic(topic, data, endpoint, accessParams)
            console.log('done');
        }
    }
}