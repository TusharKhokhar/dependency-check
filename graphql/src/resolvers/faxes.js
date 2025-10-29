const { GraphQLError } = require('graphql')
const {
  REQUIRED_ID_MISSING, REQUIRED_INPUT_MISSING, INVALID_STATUS,
  DISASSOCIATE_BEFORE_DELETION, NO_ACTIVE_LICENSE
} = require('../../helpers/error-messages')
const dot = require('dot-object')
const {
  formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, getDatabaseForGetAllAPI,
  getDatabaseOneCustomer, verifyUserAccess, verifyKioskAndUserAccess, utcDateGet,
  getStoredSecret, performEncryption
} = require('../../helpers/util')
const { Faxes } = require('../../models/collections')
const model = require('../../models/index')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { findReference } = require('../../helpers/referenceFinder')
const { customerSecurity } = require('../../utils/validation')
const CustomLogger = require("../../helpers/customLogger");
const {srFaxCall} = require("../../services/faxService");
const {Stage, bucketName} = require("../../config/config");
const { faxServicePolicy } = require("../../tokenVendingMachine/policies/customization");
const {getStsCredentials} = require("../../helpers/credentialsGenerator");
const {downloadFiles} = require("../../services/emailService");
const log = new CustomLogger()

dot.keepArray = true

module.exports = {
  Mutation: {
    async addFax (_, { addFaxInput }, context, info) {
      log.lambdaSetup(context, 'faxes', 'addFax')
      const {
        FaxDetailsID,
        FileName,
        SentStatus,
        AccountCode,
        DateQueued,
        DateSent,
        ToFaxNumber,
        Pages,
        Duration,
        RemoteID,
        ErrorCode,
        Size,
        CustomerID,
        ThingID,
        Thing,
        LocationID,
        Location,
        UpdatedAt,
        CreatedAt,
        SenderEmail,
        FaxType,
        ServiceName,
        Platform,
        CreatedBy = ObjectId.createFromHexString(context.data._id)
      } = addFaxInput
      let newFax = {
        FaxDetailsID,
        FileName,
        SentStatus,
        AccountCode,
        DateQueued,
        DateSent,
        ToFaxNumber,
        Pages,
        Duration,
        RemoteID,
        ErrorCode,
        Size,
        CustomerID,
        LocationID,
        Location,
        ThingID,
        Thing,
        UpdatedAt,
        CreatedAt,
        SenderEmail,
        FaxType,
        ServiceName,
        Platform,
        CreatedBy: CreatedBy
      }
      try {
        verifyUserAccess(context, CustomerID)
        newFax = await formObjectIds(newFax)
        newFax.IsActive = true;
        newFax = await addCreateTimeStamp(newFax)
        const db = await getDatabaseOneCustomer(context, CustomerID)
        const { insertedId } = await db.collection(Faxes).insertOne(newFax)
        return await db.collection(Faxes).findOne({ _id: insertedId })
      } catch (error) {
        throw new Error(error)
      }
    },

    async updateFax (_, { updateFaxInput, faxId, customerId }, context, info) {
        log.lambdaSetup(context, 'faxes', 'updateFax')
        dot.remove('CustomerID', updateFaxInput)
        updateFaxInput = await performEncryption(updateFaxInput)
        updateFaxInput = addUpdateTimeStamp(updateFaxInput)
        let updateObject = await dot.dot(updateFaxInput)
        updateObject = formObjectIds(updateObject, true)
      updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id)
        const db =  await getDatabaseOneCustomer(context, customerId)
      await db.collection(Faxes).updateOne({ _id: ObjectId.createFromHexString(faxId) }, {
        $set:
        updateObject
      })
      return {
        message: 'Updated successfully',
        statusCode: 200
      }
      },

    async faxDeleted (_, { IsDeleted, FaxId, customerId }, context, info) {
      log.lambdaSetup(context, 'faxes', 'FaxDeleted')
      try {
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!FaxId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        verifyUserAccess(context, customerId)
        const db = await getDatabaseOneCustomer(context, customerId)
        const response = {
          message: 'Deleted Successfully',
          statusCode: 200
        }
        const errorSet = await findReference('faxes', FaxId, db)
        if (errorSet.length > 0) {
          const newErrorSet = errorSet.join(', ')
          throw new GraphQLError(`${DISASSOCIATE_BEFORE_DELETION}${newErrorSet}`, {
            extensions: {
              code: '400'
            }
          })
        } else {
          await db.collection(Faxes).updateOne({ _id: ObjectId.createFromHexString(FaxId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: ObjectId.createFromHexString(context.data._id), DeletedAt: new Date() } })
          return response
        }
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async faxStatus (_, { IsActive, FaxId, customerId }, context) {
      log.lambdaSetup(context, 'faxes', 'faxestatus')
      try {
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!FaxId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        verifyUserAccess(context, customerId)
        const response = {
          message: IsActive ? 'Deactivated Successfully' : 'Activated Successfully',
          statusCode: 200
        }
        const db = await getDatabase(context)
        await db.collection(Faxes).updateOne({ _id: ObjectId.createFromHexString(FaxId) }, { $set: { IsActive: IsActive } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async sendSrFaxRequest(_, { faxBody, customerId, domainName }, context) {
      log.lambdaSetup(context, 'faxes', 'sendSrFaxRequest')
      const {
        FileName,
        SentStatus = 'Queued',
        AccountCode = domainName,
        ToFaxNumber,
        Pages,
        Size,
        SenderFaxNumber,
        CustomerID,
        LocationID,
        Location,
        Platform,
        ThingID,
        Thing,
        SenderEmail,
        Subject,
        Body,
        SystemFileName,
        FaxType = 'SINGLE',
        CoverPageEnabled,
        FromCoverPage,
        ToCoverPage,
        ServiceName = 'SrFax'
      } = faxBody
      try {
        const db = await getDatabaseOneCustomer(context, CustomerID)
        context.data.isKiosk  ? verifyKioskAndUserAccess(context, ObjectId.createFromHexString(CustomerID)) : verifyUserAccess(context, ObjectId.createFromHexString(CustomerID))
        const licenseData = await db.collection('Licenses').findOne({CustomerID: ObjectId.createFromHexString(customerId)})
        if (licenseData?.FaxService) {
          let faxAccountCred = await getStoredSecret(process.env.region, Stage)
          const base64 = SystemFileName ? await getAttachment(SystemFileName, customerId) : null
          faxAccountCred = JSON.parse(faxAccountCred)
          const srFaxResponse = await srFaxCall({
            faxCredential: faxAccountCred,
            senderFaxNumber: SenderFaxNumber,
            senderEmailAddress: SenderEmail,
            sendTo: ToFaxNumber,
            fileName: FileName,
            contentBase64: base64,
            subject: Subject,
            body: Body,
            domain: domainName,
            CoverPageEnabled,
            FromCoverPage,
            ToCoverPage
          })
          let faxUploads = {
            FaxDetailsID: srFaxResponse?.Result.toString(),
            FileName: FileName,
            SentStatus,
            AccountCode,
            DateQueued: utcDateGet(),
            LocationID,
            Location,
            Platform,
            ToFaxNumber,
            Pages,
            Size,
            CustomerID,
            ThingID,
            Thing,
            CoverPageEnabled,
            FromCoverPage,
            ToCoverPage,
            SenderEmail,
            FaxType,
            ServiceName
          }
          faxUploads = formObjectIds(faxUploads)
          faxUploads.IsActive = true;
          faxUploads = addCreateTimeStamp(faxUploads)
          log.info('Transaction Data', faxUploads)
          await db.collection('FaxUploads').insertOne(faxUploads)
          return {
            message: `Fax request sent successfully ${srFaxResponse?.Result?.toString()}`,
            statusCode: '201'
          }
        } else {
          throw new GraphQLError(NO_ACTIVE_LICENSE, {
            extensions: {
              code: '121'
            }
          })
        }
      } catch (error) {
        log.error(error)
        throw new Error(error)
      }
    }
  },

  Query: {
    async getFaxes (_, { paginationInput, customerIds, locationIds }, context) {
      log.lambdaSetup(context, 'faxes', 'getfaxes')
      let {
        pattern,
        pageNumber,
        limit,
        sort,
        status,
        sortKey
      } = paginationInput
      const customerId = context.data.customerIdsFilter
      const tenantDomain = context.data.TenantDomain
      pageNumber = pageNumber ? parseInt(pageNumber) : undefined
      limit = limit ? parseInt(limit) : undefined
      customerIds = customerIds || []
      const secureIds = await customerSecurity(tenantDomain, customerId, customerIds, context)
      if (secureIds) {
        customerIds = secureIds
      }
      const db = await getDatabaseForGetAllAPI(context, customerIds)
      const collection = db.collection(Faxes)
      return await model.faxes.getfaxesInformation(
        {
          status,
          pattern,
          sort,
          pageNumber,
          limit,
          sortKey,
          customerIds,
          locationIds,
          collection
        }).then(FaxList => {
        // FaxList.total = FaxList.total.length
        return FaxList
      }).catch(err => {
        log.error(err)
        throw new Error(err)
      })
    },

    async getFax (_, { FaxId, customerId }, context) {
      log.lambdaSetup(context, 'faxes', 'getFax')
      try {
        verifyUserAccess(context, customerId)
        const db = await getDatabaseOneCustomer(context, customerId)
        return await db.collection(Faxes).findOne({ _id: ObjectId.createFromHexString(FaxId) })
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}

const getAttachment = async (fileName, customerId) => {
  const policy  = await faxServicePolicy({CustomerID: customerId})
  const credentials = await getStsCredentials(policy)
  const accessParams = {
    accessKeyId: credentials.Credentials.AccessKeyId,
    secretAccessKey: credentials.Credentials.SecretAccessKey,
    sessionToken: credentials.Credentials.SessionToken
  }
  const {content} = await downloadFiles(bucketName, fileName, accessParams, 'FaxService', customerId)
  return content
}
