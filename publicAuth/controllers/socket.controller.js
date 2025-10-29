const { getDb } = require('../config/db')
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");
const { setSuccessResponse, setErrorResponse } = require('../services/api-handler')
const apiHandler = require('../services/api-handler');
const { websocketApiId } = require('../config/config')
const ERROR = require('../helpers/error-keys')
const { JOB_SENT_SUCCESSFULLY, STATUS_SENT_SUCCESSFULLY } = require('../helpers/success-constants')
const { API_AWS_VERSION, REPORTS, KIOSK_RESTART, NAYAX_STATUS, IPP_STATUS} = require('../helpers/constants')
const { websocketPolicy } = require('../tokenVendingMachine/policyTemplates')
const { getStsCredentials } = require('../helpers/credentialGenerator')
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger()

module.exports.sendSuccessToConnectedClients = async (req, res) => {
  log.lambdaSetup(req, 'sendSuccessToConnectedClients', 'socket.controller')
  let {
    body: {
      releaseCode,
      sessionId,
      action,
      status,
      message,
      dataUrl,
      accessFile,
      region,
      attributes,
      requestType,
      jobId
    }
  } = req
  try {
    const { endpoint,
      apiVersion,
      credentials} = await ApiGatewayConnector(region)
    const api = new ApiGatewayManagementApiClient({
      endpoint,
      apiVersion,
      credentials
    })
    log.info("status req: ******", { action, releaseCode, sessionId });
    const instance = await getDb()
    if (action === REPORTS) {
      accessFile ? accessFile.region = region : null
      const params = {
        ConnectionId: sessionId,
        Data: Buffer.from(JSON.stringify({
          reportsStatus: status,
          sessionId: sessionId,
          message: message,
          dataUrl,
          accessFile
        }))
      }
      await postDataToSession(api, params)
    } else if (action === KIOSK_RESTART) {
      const params = {
        ConnectionId: sessionId,
        Data: Buffer.from(JSON.stringify({
          restartStatus: status,
          sessionId: sessionId,
          message: message
        }))
      }
      await postDataToSession(api, params)
    } else if (action === NAYAX_STATUS) {
      const params = {
        ConnectionId: sessionId,
        Data: Buffer.from(JSON.stringify({
          sessionId: sessionId,
          message,
          status,
        }))
      }
      await postDataToSession(api, params)
    } else if (action === IPP_STATUS) {
      if (requestType === 'send-document' || requestType === 'print-job') {
        const publicUploadRecord = await instance.collection('PublicUploads').findOneAndUpdate(
          {
            SessionID: sessionId,
            IsIPP: true
          },
          {
            $set: {
              'JobID': jobId
            }
          },
          {includeResultMetadata: true, returnDocument: "after"})
        await instance.collection('IppSessions').updateOne({
          ReleaseCode: publicUploadRecord?.value?.ReleaseCode,
          IsDeleted: false
        }, {
          $set: {
            JobID: jobId
          }
        })
      } else {
        const params = {
          ConnectionId: sessionId,
          Data: Buffer.from(JSON.stringify({
            sessionId: sessionId,
            status: status,
            message: message,
            action: action,
            attributes: attributes,
            jobId: jobId,
            requestType: requestType
          }))
        }
        console.log(params);
        await postDataToSession(api, params)
      }
      return await apiHandler.setSuccessResponse({ message: JOB_SENT_SUCCESSFULLY }, res)
    } else if (releaseCode && sessionId ) {
      const data = await instance.collection('ThingSessions').findOne({ Topic: releaseCode, SessionID: sessionId })
      const params = {
        ConnectionId: sessionId,
        Data: Buffer.from(JSON.stringify({
          printJobReleased: status,
          releaseCode: releaseCode,
          sessionId: sessionId
        }))
      }
      await postDataToSession(api, params)
      
      if(data){
        await instance.collection('ThingSessions').findOneAndDelete({ _id: data._id })
      }
      return await setSuccessResponse({ message: STATUS_SENT_SUCCESSFULLY }, res, req)
    } else if (releaseCode) {
      const data = await instance.collection('ThingSessions').findOne({ Topic: releaseCode })
      const params = {
        ConnectionId: sessionId,
        Data: Buffer.from(JSON.stringify({
          printJobReleased: status,
          releaseCode: releaseCode,
          sessionId: sessionId
        }))
      }
      await postDataToSession(api, params)
      if(data){
        await instance.collection('ThingSessions').findOneAndDelete({ _id: data._id })
      }
      return await setSuccessResponse({ message: STATUS_SENT_SUCCESSFULLY }, res, req)
    } else {
      const data = await instance.collection('ThingSessions').findOne({ SessionID: sessionId })
      const params = {
        ConnectionId: sessionId,
        Data: Buffer.from(JSON.stringify({
          lmsValidated: status,
          sessionId: sessionId,
          message: message
        }))
      }
      await postDataToSession(api, params)
      if(data){
        await instance.collection('ThingSessions').findOneAndDelete({ _id: data._id })
      }
    }
    return await setSuccessResponse({ message: JOB_SENT_SUCCESSFULLY }, res, req)
  } catch (error) {
    console.log('error*****',error)
    log.error(error.toString())
    await setErrorResponse(null, ERROR.UNKNOWN_ERROR, res, req)
  }
}

const ApiGatewayConnector = async (region) => {
  const policy = websocketPolicy()
  const credentials = await getStsCredentials(policy)
  const accessParams = {
    accessKeyId: credentials.Credentials.AccessKeyId,
    secretAccessKey: credentials.Credentials.SecretAccessKey,
    sessionToken: credentials.Credentials.SessionToken
  }
  const endpoint = `${websocketApiId}`
  const apiVersion = API_AWS_VERSION
  return {endpoint,
    apiVersion,
    credentials: accessParams,
    region}
}

const postDataToSession = (api, params) => {
  return new Promise(async (resolve, reject) => {
    try {
      const command = new PostToConnectionCommand(params);
      await api.send(command)
      
      resolve()
    } catch (e) {
      console.log('error in send socket res:', e);
      resolve(e)
    }
  })
}
