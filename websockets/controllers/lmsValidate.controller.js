const {getDb, isolatedDatabase} = require("../config/db");
const {iotPolicy} = require("../services/policy");
const {getStsCredentials} = require("../services/credentialsGenerator");
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')

const {sendError} = require("../services/sendErrorResponse");
const {fetchIoTEndpoint, publishToTopic} = require("../services/iot-handler");
const {region} = require("../config/config");

module.exports.lmsValidate = async (connectionId, parsedBody) => {
       const data = {
                SessionID: connectionId, CardNumber: parsedBody.cardNumber,
                PIN: parsedBody.pin ? parsedBody.pin : null,
                CustomerID: parsedBody.customerId,
                LocationID: parsedBody.locationId, ThingName: parsedBody.thingName,
                RequestType: parsedBody.requestType, URL: parsedBody.url,
                ApiKey: parsedBody.apiKey ? parsedBody.apiKey : 'none',
                Secret: parsedBody.secret ? parsedBody.secret : 'none',
                Tier: parsedBody.tier ? parsedBody.tier : 'standard',
                DomainName: parsedBody.domainName ? parsedBody.domainName : 'invalid',
                CreatedAt: new Date()
            }
            const instance = await getDb()
            const policy = iotPolicy()
            const credentials = await getStsCredentials(policy)
            const accessParams = {
                accessKeyId: credentials.Credentials.AccessKeyId,
                secretAccessKey: credentials.Credentials.SecretAccessKey,
                sessionToken: credentials.Credentials.SessionToken
            };
            let premDatabase;
            let thingData = {}
            if(data.Tier !== 'standard') {
                premDatabase = await isolatedDatabase(data.DomainName)
            }
            let {
                ApiKey,
                Secret,
                URL,
                DefaultLmsValidateThing
            } = data.Tier === 'standard' ? await instance.collection('JobLists').findOne({CustomerID: ObjectId.createFromHexString(parsedBody.customerId)}) :
                await premDatabase.collection('JobLists').findOne({CustomerID: ObjectId.createFromHexString(parsedBody.customerId)});
            if (parsedBody.locationId) {
                thingData = premDatabase ? await premDatabase.collection('Things').findOne({LocationID: ObjectId.createFromHexString(parsedBody.locationId), IsDeleted: false}) :
                    await instance.collection('Things').findOne({LocationID: ObjectId.createFromHexString(parsedBody.locationId), IsDeleted: false})
            } else {
                thingData = premDatabase ? await premDatabase.collection('Things').findOne({_id: DefaultLmsValidateThing}) :
                    await instance.collection('Things').findOne({_id: DefaultLmsValidateThing})
            }
            if(parsedBody.locationId && !thingData){
                thingData = premDatabase ? await premDatabase.collection('Things').findOne({_id: DefaultLmsValidateThing}) :
                    await instance.collection('Things').findOne({_id: DefaultLmsValidateThing})
            }
            if(!thingData && !parsedBody.thingName){
                await sendError(connectionId, 'Please configure Thing to perform this action')
                return {
                    statusCode: 200
                }
            }
            data.ThingName = thingData.PrimaryRegion.ThingName
            data.LocationID = !data.LocationID || data.LocationID === "" ?
                thingData.LocationID : parsedBody.locationId
            const message = {
                SessionID: connectionId, CardNumber: data.CardNumber,
                PIN: data.PIN, ThingName: data.ThingName, RequestType: data.RequestType,
                URL: URL , APIKey: ApiKey, Secret: Secret
            }
            const topic = `cmd/eprintit/${parsedBody.customerId}/${data.LocationID}/${message.ThingName}/${parsedBody.requestType}`
            console.log('topic: ',topic);
            const endpoint = await fetchIoTEndpoint(region, accessParams)
            await publishToTopic(topic, message, endpoint, accessParams)
            await instance.collection('ThingSessions').insertOne(data)
            return {
                statusCode: 200
            }
}