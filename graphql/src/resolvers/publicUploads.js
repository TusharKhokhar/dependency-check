const { PublicUploadsCollection } = require('../../models/collections')
const model = require('../../models/index')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const {
  formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, getDatabaseOneCustomer,
  getDatabaseForGetAllAPI, verifyUserAccess, verifyKioskAndUserAccess
} = require('../../helpers/util')
const dot = require('dot-object')
const { bucketNameConverted, staffRePrintPermission, staffPrintPermission, region} = require('../../config/config')
const { S3Client, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { deleteCredentials, getSignedUrlFile } = require('../../helpers/imageUpload')
const { customerSecurity } = require('../../utils/validation')
const {getDb} = require("../../config/dbHandler");
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger()
dot.keepArray = true

module.exports = {
  Mutation: {
    async addPublicUpload (_, { addPublicUploadInput }, context, info) {
      log.lambdaSetup(context, 'publicUploads', 'addPublicUpload')
      const {
        IsProcessedFileName,
        AutomaticPrintDelivery,
        Email,
        GuestName,
        IsDelivered,
        JobExpired,
        IsPrinted,
        JobList,
        LibraryCard,
        ComputerName,
        ReleaseCode,
        TotalPagesPerFile,
        Text,
        TotalCost,
        Username,
        PrintCounter
      } = addPublicUploadInput
      let newUpload = {
        IsProcessedFileName: IsProcessedFileName,
        AutomaticPrintDelivery: AutomaticPrintDelivery,
        Email: Email,
        GuestName: GuestName,
        IsDelivered: IsDelivered,
        JobExpired: JobExpired,
        IsPrinted: IsPrinted,
        JobList: JobList,
        LibraryCard: LibraryCard,
        ComputerName: ComputerName,
        TotalPagesPerFile: TotalPagesPerFile,
        ReleaseCode: ReleaseCode,
        Text: Text,
        TotalCost: TotalCost,
        Username: Username,
        PrintCounter: PrintCounter
      }
      try {
        verifyUserAccess(context, addPublicUploadInput.CustomerID)
        newUpload = formObjectIds(newUpload)
        newUpload.IsActive = true;
        newUpload = addCreateTimeStamp(newUpload)
        const db = await getDatabaseOneCustomer(context, addPublicUploadInput.CustomerID)
        const { insertedId } = await db.collection(PublicUploadsCollection).insertOne(newUpload)
        return await db.collection(PublicUploadsCollection).findOne({ _id: insertedId })
      } catch (error) {
        throw new Error(error)
      }
    },
  // need to add support to update totalCost
    async updatePublicUpload (_, { updatePublicUploadInput, uploadId }, context, info) {
      log.lambdaSetup(context, 'publicUploads', 'updatePublicUpload')
      verifyUserAccess(context, updatePublicUploadInput.CustomerID)
      const db = await getDatabaseOneCustomer(context, updatePublicUploadInput.CustomerID)
      dot.remove('CustomerID', updatePublicUploadInput)
      updatePublicUploadInput = await addUpdateTimeStamp(updatePublicUploadInput)
      let updateObject = await dot.dot(updatePublicUploadInput)
      updatePublicUploadInput.UpdatedBy = context.data._id
      updateObject = await formObjectIds(updateObject, true)
      const job = updateObject.JobList[0]
      const fileName = job.NewFileNameWithExt
      await db.collection(PublicUploadsCollection).updateOne({ _id: ObjectId.createFromHexString(uploadId), 'JobList.NewFileNameWithExt': fileName }, {
        $set: { 'JobList.$': job }
      })
      return {
        message: 'Updated successfully',
        statusCode: 200
      }
    },

    async deleteFile (_, { DeleteFilesInput }, context) {
      log.lambdaSetup(context, 'publicUploads', 'deleteFile')
      const {
        fileNames, publicUploadId, customerId, releaseCode
      } = DeleteFilesInput
      context.data.isKiosk ? verifyKioskAndUserAccess(context, customerId) : verifyUserAccess(context, customerId)
      const db = await getDatabaseOneCustomer(context, customerId)
      const pathsArray = []
      const basePath = `PublicUploads/${customerId}/`
      const accessCredentials = await deleteCredentials(basePath)
      const s3 = new S3Client({
        region: region,
        credentials: accessCredentials
      });
      log.info(fileNames)
      await fileNames.forEach(fil => pathsArray.push({ Key: `${basePath}${fil}` }))
      const params = {
        Bucket: bucketNameConverted,
        Delete: {
          Objects: pathsArray,
          Quiet: false
        }
      }
      try {
        const command = new DeleteObjectsCommand(params);
        const data = await s3.send(command);
        log.info(data);
      } catch (err) {
        log.info(err, err.stack);
      }
      return await new Promise(async (resolve, reject) => {
        const condition = { }
        if (releaseCode) {
          Object.assign(condition, { ReleaseCode: releaseCode })
        }
        if (publicUploadId) {
          Object.assign(condition, { _id: ObjectId.createFromHexString(publicUploadId) })
        }
        if (customerId) {
          Object.assign(condition, { CustomerID: ObjectId.createFromHexString(customerId) })
        }
        for (const file of fileNames){
          await deleteMultiFiles(file, condition, db)
        }
        resolve({
          message: 'Deleted successfully',
          statusCode: 200
        })
      })
    }
  },

  Query: {
    async getPublicUploads (_, {
      paginationInput, customerIds, locationIds,
      releaseCode, libraryCard, guestName, email, text, isProcessed, isPrinted, userName
    }, context) {
      log.lambdaSetup(context, 'publicUploads', 'getPublicUploads')
      let {
        pattern,
        pageNumber,
        limit,
        sort,
        status,
        sortKey
      } = paginationInput
      if (context.data?.CustomerID) {
        verifyUserAccess(context, context.data.CustomerID);
      }
      pageNumber = pageNumber ? parseInt(pageNumber) : undefined
      limit = limit ? parseInt(limit) : undefined
      const customerId = context.data.customerIdsFilter
      const tenantDomain = context.data.TenantDomain
      customerIds = customerIds || []
      locationIds = locationIds || []
      const secureIds = await customerSecurity(tenantDomain, customerId, customerIds, context)
      if (secureIds) {
        customerIds = secureIds
      }
      if (tenantDomain !== 'admin') {
        if (customerIds.length === 0){
          customerIds = customerIds.concat(customerId)
        }
        let testIds = customerIds.map(id => id.toString())
        let removeDuplicates = (arr)  => {
          return arr.filter((item, index) => arr.indexOf(item) === index);
        }
        customerIds = removeDuplicates(testIds)
      }
      try {
        const db = await getDatabaseForGetAllAPI(context, customerIds)
        const collection = await db.collection(PublicUploadsCollection)
        const groups = context.data.user.GroupID
        let { RoleType } = await db.collection('Groups').findOne({_id: {$in: groups}, GroupType: 'Permissions'})
        let { CustomPermissions } = await db.collection('Roles').findOne({_id: RoleType, IsDeleted: false})
        CustomPermissions = CustomPermissions.map(perms => perms.toString())
        if (CustomPermissions && (!CustomPermissions.includes(staffPrintPermission) && !CustomPermissions.includes(staffRePrintPermission))) {
          userName = context.data.user.Username
        }
        return await model.publicUploads.getPublicUploadsInformation(
          {
            status,
            pattern,
            sort,
            pageNumber,
            limit,
            sortKey,
            customerIds,
            locationIds,
            collection,
            releaseCode,
            libraryCard,
            guestName,
            email,
            text,
            isProcessed,
            isPrinted,
            userName
          }).then(publicUploadList => {
          return publicUploadList
        }).catch(err => {
          log.error(err)
          throw new Error(err)
        })
      } catch (e) {
        log.error(e)
      }
    },

    async getPublicUpload (_, { uploadId, customerId, fileName }, context) {
      log.lambdaSetup(context, 'publicUploads', 'getPublicUpload')
      try {
        verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const records = {}
        const jobList = await db.collection(PublicUploadsCollection).aggregate([
          {
            $match: { _id: ObjectId.createFromHexString(uploadId) }
          },
          {
            $unwind: {
              path: '$JobList',
              preserveNullAndEmptyArrays: false
            }
          },
          {
            $lookup: {
              from: 'Customers',
              localField: 'CustomerID',
              foreignField: '_id',
              pipeline: [
                { $project: { _id: 1, Tier: 1, DomainName: 1, CustomerName: 1 } }
              ],
              as: 'CustomerData'
            }
          },
          {
            $unwind: {
              path: '$CustomerData',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: 'Locations',
              localField: 'LocationID',
              foreignField: '_id',
              as: 'LocationData'
            }
          },
          {
            $unwind: {
              path: '$LocationData',
              preserveNullAndEmptyArrays: true
            }
          }
        ]
        ).toArray()
        log.info(jobList)
        await Promise.all(jobList.map(async jobs => {
          log.info(jobs)
          if (jobs.JobList.NewFileNameWithExt === fileName) {
            let obj = {}
            const { signedUrl: newLink } = await getSignedUrlFile(jobs)
            obj = jobs
            obj.FileLink = newLink
            Object.assign(records, obj)
          }
        }))
        return records
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}


let deleteMultiFiles = (file, condition, db) => {
  return new Promise(async (resolve, reject) => {
    Object.assign(condition, {'JobList.NewFileNameWithExt': file })
    try {
      await db.collection(PublicUploadsCollection).updateOne(condition, {
        $set: {
          'JobList.$.IsDeleted': true
        }
      })
      resolve({
        message: 'Deleted successfully',
        statusCode: 200
      })
    } catch (e) {
      reject({
        message: 'Delete failed',
        statusCode: 400
      })
    }
  })
}