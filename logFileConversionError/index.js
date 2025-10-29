const zlib = require('zlib')
const {getDb, isolatedDatabase} = require('./config/db')
const { STANDARD_TIER } = require('./constants')
const { ObjectId } = require('mongodb')
const {basePath, apiKey, bucketName, domainName} = require("./config/config");
const axios = require('axios')

module.exports.handler =  async(event) => {
    try {
        console.log('-event:',event)
        const logData = event.awslogs.data
        let unZippedData = zlib.gunzipSync(Buffer.from(logData, 'base64')).toString('utf8');
        console.log('==============',unZippedData)
        unZippedData = JSON.parse(unZippedData.toString())
        console.log('==============',unZippedData)
        unZippedData = unZippedData.logEvents[0].message
        console.log('==============',unZippedData)
        unZippedData = unZippedData.split("Error Processing File")
        console.log('==============',unZippedData)
        let jsonData = JSON.parse(unZippedData[1].toString())
        console.log('JSON DATA: ',jsonData);
        let splitKey = jsonData.newkey.split('/')
        let customerId = splitKey[1]
        let fileName = splitKey[splitKey.length - 1]
        console.log('fileName: ',jsonData)
        let db = await getDb()
        const { DomainName, Tier, CustomerName } = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerId) }, { DomainName: 1,})
        db = Tier === STANDARD_TIER ? db : await isolatedDatabase(DomainName)
        const customizationsText = await db.collection('CustomizationTexts').findOne({ CustomerID: ObjectId.createFromHexString(customerId) })
        console.log('=============',customizationsText)
        await db.collection('PublicUploads').updateOne({ 'JobList.NewFileNameWithExt': fileName }, {
            $set: {
                'IsProcessedFileName.$.ErrorMessage': jsonData.ErrorMessage,
                'JobList.$.ErrorMessage': jsonData.ErrorMessage,
                'JobList.$.IsProcessed': false,
                'IsProcessedFileName.$.IsProcessed': false,
            }
        }, { multi: false })
        const publicUploadData = await db.collection('PublicUploads').findOne({ 'JobList.NewFileNameWithExt': fileName })
        let fileFailedOriginalName = fileName
        await publicUploadData.JobList.forEach(job => {
            if(job.NewFileNameWithExt === fileName){
                fileFailedOriginalName = job.OriginalFileNameWithExt
            }
        })
        const date = new Date()
        const nowUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
          date.getUTCDate(), date.getUTCHours(),
          date.getUTCMinutes(), date.getUTCSeconds())
        const currentDate = new Date(new Date(nowUtc).getTime())
        await db.collection('AuditLogs').insertOne({
            Type: 'FileProcessing',
            Date: currentDate,
            FileName: fileFailedOriginalName,
            ReleaseCode: publicUploadData.ReleaseCode,
            ErrorMessage: jsonData.ErrorMessage,
            CustomerID: ObjectId.createFromHexString(customerId)
        })
        const params = {
            email: publicUploadData.Email,
            files: [fileFailedOriginalName],
            customerName: CustomerName,
            reason: 'failed-format-file|',
            message: jsonData?.ErrorMessage === 'Invalid password' ?'We do not process Password Protected Documents': null,
            customerUrl: customizationsText.MainSection &&
            customizationsText.MainSection.TopSection &&
            customizationsText.MainSection.TopSection.CustomerLogo
              ? `https://${domainName}/logo/${bucketName}?image=${Buffer.from(customizationsText.MainSection.TopSection.CustomerLogo.split('Logos')[1]).toString('base64')}`
                : ''
        }
        console.log('--->>>>>>>>',params)
        await sendFailedNotification(params, DomainName, Tier)
    } catch (e) {
        console.log('Error: ',e)
    }
}

const sendFailedNotification = (data, domainName, Tier) => {
    return new Promise((resolve, reject) => {
        const config = {
            method: 'post',
            url: `${basePath}/job/fail`,
            headers: {
                'tier': Tier,
                'apiKey': apiKey,
                'subdomain': domainName,
                'Content-Type': 'application/json'
            },
            data: data
        };
        axios(config)
            .then(function (response) {
                resolve(JSON.parse(JSON.stringify(response.data)))
            })
            .catch(function (error) {
                console.log('error: ',error.response.data);
                reject(error)
            });
    })
}