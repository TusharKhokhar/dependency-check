const {getDb} = require("../config/db");
const {setErrorResponse, setSuccessResponse} = require("../services/api-handler");
const ERROR = require("../helpers/error-keys");
const {getVersionSignedUrl} = require("../helpers/imageUpload");
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

module.exports.getLatestKioskVersion = async (req, res) => {
    log.lambdaSetup(req, 'getLatestKioskVersion', 'version.controller')
    const db = await getDb()
    try {
        let thingType = req.query.thingType ? req.query.thingType : 'kiosk';
        const versionData = await db.collection('Versions').findOne({Release: true, IsDeleted: false, IsActive: true,
            $or: [{ThingType: {$exists: false}}, {ThingType:  thingType}]})
        const signedUrlLinks = await getVersionSignedUrl(versionData)
        versionData.DownloadLink = signedUrlLinks.signedUrl
        versionData.policy = null
        await setSuccessResponse(versionData, res, req)
    } catch (e) {
        log.error(e.toString())
        await setErrorResponse(null, ERROR.SIGNED_URL_FAILED, res, req)
    }
}