const model = require('../../models/index')
const { GraphQLError } = require('graphql')
const { REQUIRED_INPUT_MISSING, REQUIRED_ID_MISSING, PROFILE_ALREADY_EXIST } = require('../../helpers/error-messages')
const dot = require('dot-object')
const { Profiles } = require('../../models/collections')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { customerSecurity } = require('../../utils/validation')
const { formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, getDatabaseForGetAllAPI,
  getDatabaseOneCustomer, verifyUserAccess
} = require('../../helpers/util')
const CustomLogger = require("../../helpers/customLogger")
const log = new CustomLogger()
dot.keepArray = true

module.exports = {
  Mutation: {
    async addProfile (_, { addProfileInput }, context, info) {
      log.lambdaSetup(context, 'profiles', 'addProfile')
      const {
        Profile,
        ProfileType,
        Description,
        CustomerID,
        Tags,
        Priority,
        ProfileSetting,
        Login,
        Driver,
        HideFromList,
        AutoUpdate,
        IsActive,
        CreatedBy = ObjectId.createFromHexString(context.data._id)
      } = addProfileInput
      verifyUserAccess(context, CustomerID)
      Driver && Driver.LocationId && Driver.LocationId !== '' ?  Driver.LocationId = ObjectId.createFromHexString(Driver.LocationId) : null
      let newProfile = {
        Profile: Profile,
        ProfileType: ProfileType,
        CustomerID: CustomerID,
        Description: Description,
        Tags: Tags,
        ProfileSetting: ProfileSetting,
        Priority: Priority,
        Login: Login,
        Driver: Driver,
        HideFromList: HideFromList,
        AutoUpdate: AutoUpdate,
        CreatedBy: CreatedBy,
        IsActive: IsActive
      }
      try {
        newProfile = formObjectIds(newProfile)
        newProfile = addCreateTimeStamp(newProfile)
        const db = await getDatabaseOneCustomer(context, CustomerID)
        const profileValidate = await db.collection(Profiles).findOne({ Profile: Profile, CustomerID: ObjectId.createFromHexString(CustomerID), IsDeleted: false })
        if (profileValidate) {
          throw new GraphQLError(PROFILE_ALREADY_EXIST, {
            extensions: {
              code: '400'
            }
          })
        } else {
          if(newProfile.ProfileType === 'Driver' && Driver.Default === true) {
            await db.collection(Profiles).updateMany({ CustomerID: ObjectId.createFromHexString(CustomerID), ProfileType: 'Driver' }, {$set: {'Driver.Default': false}})
          }
          const { insertedId } = await db.collection(Profiles).insertOne(newProfile)
          return await db.collection(Profiles).findOne({ _id: insertedId })
        }
      } catch (error) {
        throw new Error(error)
      }
    },

    async updateProfile (_, { updateProfileInput, profileId, customerId }, context, info) {
      log.lambdaSetup(context, 'profiles', 'updateProfile')
      verifyUserAccess(context, customerId)
      const db =  await getDatabaseOneCustomer(context, customerId)
      if(updateProfileInput.ProfileType === 'Driver' && updateProfileInput.Driver.Default === true) {
        await db.collection(Profiles).updateMany({
          CustomerID: ObjectId.createFromHexString(customerId),
          ProfileType: 'Driver'
        }, {$set: {'Driver.Default': false}})
      }
      dot.remove('CustomerID', updateProfileInput)
      updateProfileInput = addUpdateTimeStamp(updateProfileInput) 
      let updateObject = await dot.dot(updateProfileInput)
      updateProfileInput && updateProfileInput.Driver &&
      updateProfileInput.Driver.LocationId && updateProfileInput.Driver.LocationId !== ''  ?
      updateObject['Driver.LocationId'] = ObjectId.createFromHexString(updateProfileInput.Driver.LocationId) : null
      updateObject = formObjectIds(updateObject, true)
      updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id)
      await db.collection(Profiles).updateOne({ _id: ObjectId.createFromHexString(profileId) }, {
        $set:
        updateObject
      })
      return {
        message: 'Updated successfully',
        statusCode: 200
      }
    },

    async profileDeleted (_, { IsDeleted, profileId, customerId }, context) {
      log.lambdaSetup(context, 'profiles', 'profileDeleted')
      try {
        if (IsDeleted === null || IsDeleted === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!profileId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        verifyUserAccess(context, customerId)
        const response = {
          message: IsDeleted ? 'Deactivated Successfully' : 'Activated Successfully',
          statusCode: 200
        }
        const db = await getDatabaseOneCustomer(context, customerId)
        await db.collection(Profiles).updateOne({ _id: ObjectId.createFromHexString(profileId) }, { $set: { IsDeleted: IsDeleted } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async profileStatus (_, { IsActive, profileId, customerId }, context) {
      log.lambdaSetup(context, 'profiles', 'profileStatus')
      try {
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!profileId) {
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
        const db = await getDatabaseOneCustomer(context, customerId)
        await db.collection(Profiles).updateOne({ _id: ObjectId.createFromHexString(profileId) }, { $set: { IsActive: IsActive } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    }

  },

  Query: {
    async getProfiles (_, { paginationInput, customerIds }, context) {
      log.lambdaSetup(context, 'profiles', 'getProfiles')
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
      const collection = db.collection(Profiles)
      return await model.profiles.getProfilesInformation(
        {
          status,
          pattern,
          sort,
          pageNumber,
          limit,
          sortKey,
          collection,
          customerIds
        }).then(profileList => {
        return profileList
      }).catch(err => {
        log.error(err)
        throw new Error(err)
      })
    },

    async getProfile (_, { profileId, customerId }, context) {
      log.lambdaSetup(context, 'profiles', 'getProfile')
      try {
        verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        const response = await db.collection(Profiles).aggregate([
          {
            $match: {
              _id: ObjectId.createFromHexString(profileId), CustomerID: ObjectId.createFromHexString(customerId)
            }
          },
          {
            $lookup: {
              from: 'Customers',
              localField: 'CustomerID',
              foreignField: '_id',
              pipeline: [
                { $project: { _id: 1, CustomerName: 1, Tier: 1, DomainName: 1 } }
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
              from: 'Groups',
              localField: 'ProfileSetting.PrintConfigurationGroup',
              foreignField: '_id',
              as: 'ProfileSetting.PrintConfigurationGroup'
            }
          },
          {
            $unwind: {
              path: '$ProfileSetting.PrintConfigurationGroup',
              preserveNullAndEmptyArrays: true
            }
          }
        ]).toArray()
        return response[0]
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
