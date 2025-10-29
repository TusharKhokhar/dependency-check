const { GraphQLError } = require('graphql')
const {
  REQUIRED_ID_MISSING, INVALID_STATUS,
  DISASSOCIATE_BEFORE_DELETION, VERSION_ALREADY_EXIST, THING_TYPE_NOT_SUPPORTED, THING_TYPE_NOT_ALLOWED_UPDATE,
  THING_TYPE_NOT_SUPPORTED_UPDATE
} = require('../../helpers/error-messages')
const dot = require('dot-object')
const {
  formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, getDatabaseForGetAllAPI,
  getDatabaseOneCustomer, verifyUserAccess
} = require('../../helpers/util')
const { Versions } = require('../../models/collections')
const model = require('../../models/index')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { findReference } = require('../../helpers/referenceFinder')
const { customerSecurity } = require('../../utils/validation')
const {kioskVersionUpload, kioskVersionUploadV2} = require("../../helpers/imageUpload");
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger()

dot.keepArray = true

module.exports = {
  Mutation: {
    async addVersion (_, { addVersionInput }, context, info) {
      log.lambdaSetup(context, 'versions', 'addVersion')
      const {
        CustomerID,
        VersionNumber,
        ReleaseDate,
        Enabled,
        Disabled,
        Release,
        ThingType,
        Package,
        VersionDescription,
        Tags,
        CreatedBy = ObjectId.createFromHexString(context.data._id),
        IsActive
      } = addVersionInput
      let newVersion = {
        CustomerID: ObjectId.createFromHexString(CustomerID),
        VersionNumber,
        ReleaseDate,
        Enabled,
        Disabled,
        Release,
        ThingType,
        Package,
        VersionDescription,
        Tags,
        CreatedBy: CreatedBy,
        IsActive
      }
      try {
        verifyUserAccess(context, CustomerID)
        newVersion = await formObjectIds(newVersion)
        newVersion = await addCreateTimeStamp(newVersion)
        const db = await getDatabaseOneCustomer(context, CustomerID)
        const {ThingTypeUpdateSupport: supportedThingTypes} = await db.collection('Dropdowns').findOne({}, {ThingTypeUpdateSupport: 1})
        if (!supportedThingTypes.includes(ThingType?.toLowerCase())) {
          throw new Error(THING_TYPE_NOT_ALLOWED_UPDATE)
        }
        const versionNumberValidate = await db.collection(Versions).findOne({ VersionNumber: VersionNumber, CustomerID: ObjectId.createFromHexString(CustomerID), ThingType: ThingType, IsDeleted: false })
        if (versionNumberValidate) {
          throw new GraphQLError(VERSION_ALREADY_EXIST, {
            extensions: {
              code: '400'
            }
          })
        }
        const { insertedId } = await db.collection(Versions).insertOne(newVersion)
        return await db.collection(Versions).findOne({ _id: insertedId })
      } catch (error) {
        throw new Error(error)
      }
    },

    async updateVersion (_, { updateVersionInput, versionId }, context, info) {
      log.lambdaSetup(context, 'versions', 'updateVersion')
      const db = await getDatabaseOneCustomer(context, updateVersionInput.CustomerID)
      verifyUserAccess(context, updateVersionInput.CustomerID)
      dot.remove('CustomerID', updateVersionInput)
      dot.remove('VersionNumber', updateVersionInput)
      const {ThingTypeUpdateSupport: supportedThingTypes} = await db.collection('Dropdowns').findOne({}, {ThingType: 1})
      if (!supportedThingTypes.includes(updateVersionInput.ThingType)) {
        throw new Error(THING_TYPE_NOT_SUPPORTED_UPDATE)
      }
      if(updateVersionInput.Release) {
        await db.collection(Versions).updateMany({ThingType: updateVersionInput.ThingType}, {$set: {Release: false}}, {multi: true})
      }
      let updateObject = await dot.dot(updateVersionInput)
      updateVersionInput.UpdatedBy = ObjectId.createFromHexString(context.data._id)
      updateObject = formObjectIds(updateObject, true)
      updateObject["IsActive"] = updateVersionInput.IsActive === true
      updateObject = addUpdateTimeStamp(updateObject)
      await  db.collection(Versions).updateOne({ _id: ObjectId.createFromHexString(versionId) }, {
        $set:
        updateObject
      })
      return {
        message: 'Updated successfully',
        statusCode: 200
      }
    },

    async versionDeleted (_, { IsDeleted, versionId, customerId }, context, info) {
      log.lambdaSetup(context, 'versions', 'versionDeleted')
      try {
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!versionId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        verifyUserAccess(context, customerId)
        const db = await getDatabase(context)
        const response = {
          message: 'Deleted Successfully',
          statusCode: 200
        }
        const errorSet = await findReference('versions', versionId, db)
        if (errorSet.length > 0) {
          const newErrorSet = errorSet.join(', ')
          throw new GraphQLError(`${DISASSOCIATE_BEFORE_DELETION}${newErrorSet}`, {
            extensions: {
              code: '400'
            }
          })
        } else {
          await db.collection(Versions).updateOne({ _id: ObjectId.createFromHexString(versionId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: ObjectId.createFromHexString(context.data._id), DeletedAt: new Date() } })
          return response
        }
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async uploadVersion (_, { versionUploadInput }, context) {
      log.lambdaSetup(context, 'versions', 'uploadVersion')
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        return await kioskVersionUpload(versionUploadInput)
      } catch (err) {
        log.error(err);
        throw new Error(err)
      }
    },

    async uploadVersionV2 (_, { versionUploadInput }, context) {
      log.lambdaSetup(context, 'versions', 'uploadVersionV2')
      try {
        if (context.data?.CustomerID) {
          verifyUserAccess(context, context.data.CustomerID);
        }
        return await kioskVersionUploadV2(versionUploadInput)
      } catch (err) {
        log.error(err);
        throw new Error(err)
      }
    }
  },

  Query: {
    async getVersions (_, { paginationInput, customerIds }, context) {
      log.lambdaSetup(context, 'versions', 'getVersions')
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
      const collection = db.collection(Versions)
      return await model.versions.getVersionsInformation(
        {
          status,
          pattern,
          sort,
          pageNumber,
          limit,
          sortKey,
          customerIds,
          collection
        }).then(versionList => {
        return versionList
      }).catch(err => {
        log.error(err)
        throw new Error(err)
      })
    },

    async getVersion (_, { versionId, customerId }, context) {
      log.lambdaSetup(context, 'versions', 'getVersion')
      try {
        verifyUserAccess(context, customerId)
        const db = await getDatabaseOneCustomer(context, customerId)
        return await db.collection(Versions).findOne({ _id: ObjectId.createFromHexString(versionId) })
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
