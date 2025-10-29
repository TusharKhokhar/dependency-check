const { STANDARD_TIER } = require('../helpers/constants')
const { getDb, isolatedDatabase } = require('../config/db')
const { setErrorResponse, setSuccessResponse, setErrorResponseByServer } = require('../services/api-handler')
const ERROR = require('../helpers/error-keys')
const { iotPolicy } = require('../tokenVendingMachine/policyTemplates')
const { getStsCredentials } = require('../helpers/credentialGenerator')
const { retrieveEndpoint, publishToTopic, thingDetails } = require('../services/iot-handler')
const { region, bucketNameConverted, orgAuthBaseUrl } = require('../config/config')
const { deleteCredentials } = require('../helpers/imageUpload')
const { S3Client, DeleteObjectsCommand } = require("@aws-sdk/client-s3");
const CustomLogger = require("../helpers/customLogger");
const axios  = require('axios')
const models = require('../models')
const log = new CustomLogger()

module.exports.getPrintJobs = async (req, res) => {
  const {
    query: {
      releaseCode,
      guestName,
      email,
      cardNumber,
      userName
    }
  } = req
  if (!releaseCode && !guestName && !email && !cardNumber && !userName) {
    await setErrorResponse(null, ERROR.REQUIRED_FIELDS_MISSING, res, req)
  } else {
    const accessKeyId = req.accessKeyId
    let db = await getDb()
    const { CustomerID } = await db.collection('PartnersAccess').findOne({ ApiKey: accessKeyId, IsDeleted: false, IsActive: true })
    const customerData = await db.collection('Customers').findOne({ _id: CustomerID, IsDeleted: false, IsActive: true })
    if (customerData && customerData.Tier !== 'standard') {
      db = await isolatedDatabase(customerData.DomainName)
    }
    const { error, jobs } = await handlerForJobs(req, res, db, accessKeyId)
    if (error) {
      await setErrorResponse(null, jobs, res, req)
    } else {
      await setSuccessResponse(jobs, res, req)
    }
  }
}

module.exports.sendPrintJobs = async (req, res) => {
  log.lambdaSetup(req, 'partner.controller', 'sendPrintJobs')
  const {
    body: {
      fileNames,
      releaseCode,
      device,
      sessionId: sessionId
    }
  } = req
  const accessKeyId = req.accessKeyId
  try {
    let db = await getDb()
    const { CustomerID } = await db.collection('PartnersAccess').findOne({ ApiKey: accessKeyId, IsDeleted: false, IsActive: true })
    const customerData = await db.collection('Customers').findOne({ _id: CustomerID, IsDeleted: false, IsActive: true })
    if (customerData && customerData.Tier !== 'standard') {
      db = await isolatedDatabase(customerData.DomainName)
    }
    const ThingID = await db.collection('Devices').findOne({ Device: device, CustomerID: CustomerID, IsDeleted: false })
    if (!ThingID) {
      setErrorResponse(null, ERROR.THING_NOT_FOUND, res, req)
    } else {
      const thingData = await db.collection('Things').findOne({ _id: ThingID.ThingID, CustomerID: CustomerID })
      const policy = iotPolicy()
      const credentials = await getStsCredentials(policy)
      const accessParams = {
        accessKeyId: credentials.Credentials.AccessKeyId,
        secretAccessKey: credentials.Credentials.SecretAccessKey,
        sessionToken: credentials.Credentials.SessionToken
      }
      const currentStatus = await thingDetails(thingData, accessParams)
      const onlineStatus = currentStatus.things[0] && currentStatus.things[0].connectivity &&
        currentStatus.things[0].connectivity.connected
        ? currentStatus.things[0].connectivity.connected
        : false
      if (!onlineStatus) {
        await setErrorResponse(null, ERROR.THING_NOT_ONLINE, res, req)
      } else {
        const message = {
          SessionID:  sessionId ? sessionId : 'partner',
          RequestType: 'printrelease',
          ReleaseCode: releaseCode,
          FileNames: fileNames,
          Device: device,
          CustomerID: CustomerID.toString()
        }
        const topic = `cmd/${thingData.ThingType}/${thingData.CustomerID.toString()}/${thingData.LocationID.toString()}/${thingData.PrimaryRegion.ThingName}/printrelease`
        log.info(topic)
        const endpoint = await retrieveEndpoint(region, accessParams)
        await publishToTopic(topic, message, endpoint, accessParams)
        await setSuccessResponse({ message: 'Job sent successfully' }, res, req)
      }
    }
  } catch (e) {
    log.info('Error: ', e)
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}

const handlerForJobs = async (req, res, db, accessKeyId) => {
  const {
    query: {
      releaseCode,
      guestName,
      email,
      cardNumber,
      userName
    }
  } = req
  const { CustomerID } = await db.collection('PartnersAccess').findOne({ ApiKey: accessKeyId, IsDeleted: false, IsActive: true })
  if (!CustomerID) {
    return {
      error: true,
      jobs: ERROR.UNAUTHORIZED
    }
  } else {
    const customerData = await db.collection('Customers').findOne({ _id: CustomerID, IsDeleted: false, IsActive: true })
    if (customerData && customerData.Tier !== 'standard') {
      db = await isolatedDatabase(customerData.DomainName)
    }
    const condition = { CustomerID: CustomerID, JobExpired: false }
    if (releaseCode) {
      Object.assign(condition, { ReleaseCode: releaseCode })
    }
    if (guestName) {
      Object.assign(condition, { Username: guestName })
    }
    if (email) {
      Object.assign(condition, { Email: email })
    }
    if (cardNumber) {
      Object.assign(condition, { LibraryCard: cardNumber })
    }
    if (userName) {
      Object.assign(condition, { Username: userName })
    }
    const releaseJob = await db.collection('PublicUploads').find(condition).toArray()
    if (!releaseJob) {
      return {
        error: true,
        jobs: ERROR.RELEASE_CODE_INVALID
      }
    } else {
      const finalPrintJobsResponse = []
      log.info(releaseJob)
      await releaseJob.forEach(jobsRelease => {
        let i = 0
        for (const job of jobsRelease.JobList) {
          const obj = {
            Copies: job.Copies,
            Duplex: job.Duplex,
            Color: job.Color,
            PaperSize: job.PaperSize,
            Orientation: job.Orientation,
            PageRange: job.PageRange,
            TotalPagesPerFile: job.TotalPagesPerFile,
            OriginalFileNameWithExt: job.OriginalFileNameWithExt,
            NewFileNameWithExt: job.NewFileNameWithExt,
            LibraryCard: jobsRelease.LibraryCard,
            LocationID: jobsRelease.LocationID,
            ReleaseCode: jobsRelease.ReleaseCode,
            Username: jobsRelease.Username,
            GuestName: jobsRelease.GuestName,
            IsProcessed: jobsRelease.IsProcessedFileName[i].IsProcessed ? jobsRelease.IsProcessedFileName[i].IsProcessed : false,
            CreatedAt: jobsRelease.CreatedAt
          }
          if (!job.IsDeleted) {
            finalPrintJobsResponse.push(obj)
          }
          i++
        }
      })
      return {
        error: false,
        jobs: finalPrintJobsResponse
      }
    }
  }
}

module.exports.deleteJobs = async (req, res) => {
  log.lambdaSetup(req, 'partner.controller', 'deleteJobs')
  const {
    body: {
      releaseCode,
      fileNames
    }
  } = req
  const accessKeyId = req.accessKeyId
  let db = await getDb()
  const { CustomerID } = await db.collection('PartnersAccess').findOne({ ApiKey: accessKeyId, IsDeleted: false, IsActive: true })
  if (!CustomerID) {
    await setErrorResponse(null, ERROR.UNAUTHORIZED, res, req)
  } else {
    const customerData = await db.collection('Customers').findOne({ _id: CustomerID, IsDeleted: false, IsActive: true })
    if (customerData && customerData.Tier !== 'standard') {
      db = await isolatedDatabase(customerData.DomainName)
    }
    const pathsArray = []
    const basePath = `PublicUploads/${CustomerID.toString()}/`
    const accessCredentials = await deleteCredentials(basePath)
    const s3 = new S3Client({
      credentials: accessCredentials,
      region: region });
    log.info(fileNames, accessCredentials)
    await fileNames.forEach(fil => pathsArray.push({ Key: `${basePath}${fil}` }))
    const params = {
      Bucket: bucketNameConverted,
      Delete: {
        Objects: pathsArray,
        Quiet: false
      }
    }
    try {
      const data = await s3.send(new DeleteObjectsCommand(params));
      log.info('Response:', data);
    } catch (err) {
      log.info(err, err.stack);
    }
    try {
      await db.collection('PublicUploads').updateOne({ 'JobList.NewFileNameWithExt': { $in: fileNames }, ReleaseCode: releaseCode }, {
        $set: {
          'JobList.$.IsDeleted': true
        }
      })
      await setSuccessResponse({
        message: 'Deleted successfully'
      }, res, req)
    } catch (e) {
      log.info(e, e.stack);
      await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
    }
  }
}

const getUserAuthData = async (resourceURL, body, tier) => {
  return new Promise((resolve, reject) => {
    const apiURL = `${resourceURL}/auth/login`;
    const config = {
      headers: {
        tier,
      },
    };
    axios
      .post(apiURL, body, config)
      .then((response) => {
        resolve(response.data);
      })
      .catch(async (error) => {
        log.info('Error: ', error)
        reject(error.response?.data?.error || error)
      });
  });
};

module.exports.validateUser = async (req, res) => {
  try {
    log.lambdaSetup(req, "partner.controller", "validateUser");
    const {
      body: { userName, password, identityProvider },
    } = req;
    const accessKeyId = req.accessKeyId
    let db = await getDb();
    const { CustomerID } = await db.collection("PartnersAccess").findOne({ ApiKey: accessKeyId, IsDeleted: false, IsActive: true });
    if (!CustomerID) {
      log.info('customer not found')
      return await setErrorResponse(null, ERROR.UNAUTHORIZED, res, req);
    } else {
      const customerData = await db.collection("Customers").findOne({ _id: CustomerID, IsDeleted: false, IsActive: true });
      if (customerData && customerData.Tier !== "standard") {
        db = await isolatedDatabase(customerData.DomainName);
      }
      const authProviderData = await db.collection("AuthProviders").findOne({ CustomerID: CustomerID, ProviderName: identityProvider, IsDeleted: false, IsActive: true});
      log.info('authProviderData', authProviderData)
      if (!authProviderData) {
        return await setErrorResponse(null, ERROR.AUTH_PROVIDER_NOT_FOUND, res, req);
      }
      const basePath = orgAuthBaseUrl
      const body = {
        orgId: authProviderData.OrgID,
        authId: authProviderData._id
      };
      const providerType = authProviderData.AuthProvider
      let user = null;
      if (providerType === "internal") {
          user = await models.users.findUserByUserName(db, userName, customerData.DomainName)
          if (!user) {
            return await setErrorResponse(null, ERROR.INVALID_USER, res, req);
          }
          const isMatch = await models.users.comparePassword({ candidatePassword: password, hash: user?.Password })
          if (!isMatch) {
            return await setErrorResponse(null, ERROR.INVALID_USERNAME_OR_PASSWORD_KEY, res, req);
          }
          const groupData = await db
            .collection("Groups")
            .find({ _id: { $in: user?.GroupID } })
            .toArray();

          user.Group = groupData?.map((group) => {
            return {
              _id: group._id,
              GroupName: group.GroupName,
              GroupType: group.GroupType,
            };
          });
      } else {
        if (providerType === "ldap") {
          body["username"] = userName;
          body["password"] = password;
        } else if (providerType === "innovative" || providerType === "sip2") {
          body["barcode"] = userName;
          body["pin"] = password;
        } else if (providerType === "sirsi" || providerType === "polaris") {
          body["barcode"] = userName;
          body["password"] = password;
        } else {
          return await setErrorResponse(null, ERROR.INVALID_AUTH_PROVIDER, res, req);
        }
        const userAuthData = await getUserAuthData(basePath, body, customerData.Tier);
        if (!userAuthData?.data || userAuthData?.status === 0) {
          return await setErrorResponse(null, ERROR.INVALID_USER, res, req);
        }
        user = userAuthData.data;
      }

      const response = {
        CustomerID: user?.CustomerID || null,
        TenantDomain: user?.TenantDomain || null,
        Username: user.Username || null,
        FirstName: user.FirstName || null,
        LastName: user.LastName || null,
        PrimaryEmail: user.PrimaryEmail || null,
        Mobile: user.Mobile || null,
        CardNumber: user.CardNumber || null,
        Group: user.Group,
      };
      return await setSuccessResponse(response, res)
    }
  } catch (error) {
    log.info('catch error....', error)
    return setErrorResponseByServer(error, res)
  }
};