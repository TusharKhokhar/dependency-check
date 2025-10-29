const config = require('./config/config.js')
const upload = require("./upload");
const azureService = require("./azureServicie");
const translateService = require("./translate");
const awsService = require("./awsService");
const {Stage} = require("./config/config");
const {retrieveFilesAndDeliverJobs} = require("./app");
const {getDb} = require("./config/dbHandler");
const { getObjectId: ObjectId } = require("./helpers/objectIdConverter")

module.exports.handler = async (event) => {
    try {
        const jobData = event.data.jobData
        const customerData = event.data.customerData
        const azureKeys = await awsService.getAzureSecrets(config.region)
        if (event.data.isTranslated) {
            await retrieveFilesAndDeliverJobs(event.data, azureKeys)
        } else {
            const db = await getDb()
            const currentStatus = await db.collection('TranslationUploads').findOne({_id: ObjectId.createFromHexString(jobData._id)})
            if (currentStatus.TranslationTrackID) {
                console.log('skipping duplicate event')
            } else {
                const sourceLang = jobData.SourceLanguage
                const targetLang = jobData.TargetLanguage
                const folder = `${Stage}/${jobData.CustomerID.toString()}/${jobData._id.toString()}/`
                const response = await awsService.getSignedUrls(jobData, customerData._id, false, null)
                for (let file of response) {
                    const onlyFileName = folder + file.fileName.split('/')[file.fileName.split('/').length - 1]
                    await upload.uploadFileToAzure(azureKeys, onlyFileName, file.signedAccessLink.signedUrl)
                }
                const sourceContainerSasUrl = await azureService.generateSASToken(azureKeys, 'source')
                const targetContainerSasUrl = await azureService.generateSASToken(azureKeys, 'target')
                const responseTranslation = await translateService.startTranslate(sourceContainerSasUrl, targetContainerSasUrl,
                  sourceLang, targetLang, folder, azureKeys.subscriptionKey, azureKeys.translateAccount)
                const date = new Date()
                const now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
                  date.getUTCDate(), date.getUTCHours(),
                  date.getUTCMinutes(), date.getUTCSeconds())
                await db.collection('TranslationUploads').updateOne({_id: ObjectId.createFromHexString(jobData._id)},
                  {
                      $set: {
                          TranslationStatus: responseTranslation.status,
                          TranslationTrackID: responseTranslation.id,
                          TranslationStartTime: new Date(now_utc)
                      }
                  })
            }
        }
    } catch (error) {
        console.log('error: ',error);
    }
}