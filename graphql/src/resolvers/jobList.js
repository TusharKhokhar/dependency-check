const { GraphQLError } = require('graphql')
const { REQUIRED_ID_MISSING, REQUIRED_INPUT_MISSING, JOBLIST_ALREADY_EXIST, INVALID_STATUS } = require('../../helpers/error-messages')
const dot = require('dot-object')
const { JobLists } = require('../../models/collections')
const model = require('../../models/index')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const {
  formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, getDatabaseForGetAllAPI,
  getDatabaseOneCustomer, verifyUserAccess
} = require('../../helpers/util')
const { STANDARD_TIER } = require('../../helpers/constants')
const { isolatedDatabase } = require('../../config/dbHandler')
const { customerSecurity } = require('../../utils/validation')
const CustomLogger = require("../../helpers/customLogger");
const ipValidator = require('ipaddr.js');
const log = new CustomLogger()
dot.keepArray = true

module.exports = {
  Mutation: {
    async updateJobList (_, { updateJobListInput, jobListId }, context, info) {
      log.lambdaSetup(context, 'jobLists', 'updateJobList')
      try {
        const {
          CustomerID
        } = updateJobListInput
        verifyUserAccess(context, updateJobListInput.CustomerID)
        let db = await getDatabase(context)
        const customerData = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(updateJobListInput.CustomerID) }, { DomainName: 1, Tier: 1 })
        const {PaperSize} = await db.collection('Dropdowns').findOne({}, {PaperSize: 1})
        if (customerData && customerData.Tier !== STANDARD_TIER) {
          db = await isolatedDatabase(customerData.DomainName)
        }
        dot.remove('CustomerID', updateJobListInput)
        await validateIpAddressAndCidrRanges(updateJobListInput)
        const validateJobList = await db.collection(JobLists).findOne({ _id: { $ne: ObjectId.createFromHexString(jobListId) }, CustomerID: ObjectId.createFromHexString(CustomerID) })
        if (validateJobList) {
          throw new GraphQLError(JOBLIST_ALREADY_EXIST, {
            extensions: {
              code: '406'
            }
          })
        } else {
          const jobList = await db.collection(JobLists).findOne({ _id: ObjectId.createFromHexString(jobListId), CustomerID: ObjectId.createFromHexString(CustomerID) })
          if (PaperSize.includes(updateJobListInput?.DefaultValues?.PaperSize)) {
            updateJobListInput = addUpdateTimeStamp(updateJobListInput)
            let updateObject = await dot.dot(updateJobListInput)
            updateJobListInput.UpdatedBy = ObjectId.createFromHexString(context.data._id)
            updateObject = formObjectIds(updateObject, true)
            await db.collection(JobLists).updateOne({ _id: ObjectId.createFromHexString(jobListId) }, {
              $set:
              updateObject
            })
            return {
              message: 'Updated successfully',
              statusCode: 200
            }
          } else {
            throw new GraphQLError('Not a valid Paper Size', {
              extensions: {
                code: '406'
              }
            })
          }
        }
      } catch (e) {
        throw new GraphQLError(e, {
          extensions: {
            code: '400'
          }
        })
      }
    },

    async jobListDeleted (_, { IsDeleted, jobListId, customerId }, context, info) {
      log.lambdaSetup(context, 'jobLists', 'jobListDeleted')
      try {
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!jobListId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        verifyUserAccess(context, customerId)
        const response = {
          message: 'Deleted Successfully',
          statusCode: 200
        }
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        await db.collection(JobLists).updateOne({ _id: ObjectId.createFromHexString(jobListId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: ObjectId.createFromHexString(context.data._id), DeletedAt: new Date() } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async jobListStatus (_, { IsActive, jobListId, customerId }, context) {
      log.lambdaSetup(context, 'jobLists', 'jobListStatus')
      try {
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!jobListId) {
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
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        await db.collection(JobLists).updateOne({ _id: ObjectId.createFromHexString(jobListId) }, { $set: { IsActive: IsActive } })
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    }

  },

  Query: {
    async getJobLists (_, { paginationInput, customerIds }, context) {
      log.lambdaSetup(context, 'jobLists', 'getJobLists')
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
      const collection = db.collection(JobLists)
      return await model.jobLists.getJobListsInformation({ status, pattern, sort, pageNumber, limit, sortKey, customerIds, collection }).then(jobListList => {
        jobListList.total = jobListList.total.length
        return jobListList
      }).catch(err => {
        log.error(err)
        throw new Error(err)
      })
    },

    async getJobList (_, { jobListId, customerId }, context) {
      log.lambdaSetup(context, 'jobLists', 'getJobList')
      try {
        verifyUserAccess(context, customerId)
        const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
        return await db.collection(JobLists).findOne({ _id: ObjectId.createFromHexString(jobListId) })
      } catch (err) {
        throw new Error(err)
      }
    },

    async getJobListByCustomerID (_, { customerId }, context) {
      log.lambdaSetup(context, 'jobLists', 'getJobListByCustomerID')
      try {
        verifyUserAccess(context, customerId)
        const db = await getDatabase(context)
        return await db.collection(JobLists).findOne({ CustomerID: ObjectId.createFromHexString(customerId) })
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}

const validateIpAddressAndCidrRanges = async (updateJobListInput) => {
  const isValidIP = (address) => ipValidator.IPv4.isIPv4(address) || ipValidator.IPv6.isIPv6(address);
  const isValidCIDR = (cidr) => {
    try {
      ipValidator.parseCIDR(cidr); // This will throw an error if the CIDR is invalid
      return true;
    } catch {
      return false;
    }
  };
  if (updateJobListInput?.IppSettings?.AllowedCIDRorIPs?.length > 0) {
    await updateJobListInput?.IppSettings?.AllowedCIDRorIPs.forEach(address => {
      if(address.includes('/') && !isValidCIDR(address)) {
        throw new GraphQLError('Not a valid CIDR', {
          extensions: {
            code: '406'
          }
        })
      } else if (!address.includes('/')  && !isValidIP(address)) {
        throw new GraphQLError('Not a valid address', {
          extensions: {
            code: '406'
          }
        })
      }
    })
  }
}