const { GraphQLError } = require('graphql')
const { getStsCredentials } = require('../../helpers/credentialsGenerator')
const { emailPolicy } = require('../../tokenVendingMachine/policyTemplates')
const { sendEmailV2} = require('../../mailer/mailer')
const { generateEJSTemplate } = require('../../mailer/ejsTemplate')
const { APPROVAL_SIGNUP } = require('../../helpers/success-constants')
const dot = require('dot-object')
const model = require('../../models/index')
const {
  Customers, Customizations, CustomizationTexts, JobLists, Groups, Users, Licenses,
  Locations, Permissions, CustomPermissions, Roles, Things, Devices, PublicUploadsCollection, Usages
} = require('../../models/collections')
const { formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, getDualDb, verifyUserAccess, checkValidUser, verifyKioskAndUserAccess, verifyUserPermissions
} = require('../../helpers/util')
dot.keepArray = true

const {
  DATABASE_ERROR,
  CUSTOMER_NOT_FOUND,
  CUSTOMER_ALREADY_EXIST,
  DOMAIN_ALREADY_EXIST,
  REQUIRED_INPUT_MISSING,
  REQUIRED_ID_MISSING,
  INVALID_STATUS, ADMIN_CUSTOMER_DELETE_NOT_ALLOWED, UNAUTHORIZED
} = require('../../helpers/error-messages')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { generatePalette } = require('../../services/themeGenerator')
const { CUSTOMER_TYPE_CHECK, UPLOAD_PATH } = require('../../utils/constants')
const { userMail } = require('./users')
const bcrypt = require('bcryptjs');
const { blockedDomains } = require('../../config/config')
const { isolatedDatabase } = require('../../config/dbHandler')
const { STANDARD_TIER } = require('../../helpers/constants')
const {customerSecurity} = require("../../utils/validation");
const CustomLogger = require("../../helpers/customLogger");
const crypto = require("crypto");
const { v4: uuidv4 } = require('uuid');
const log = new CustomLogger()

module.exports = {
  Mutation: {
    async onboardCustomer (_, { OnboardCustomerInput }, context, info) {
      log.lambdaSetup(context, 'customers', 'onboardCustomer')
      let {
        CustomerData: customerInput,
        LicenseData: licenseInput,
        CustomizationData: customizationInput,
        CustomizationTextData: customizationTextInput,
        UserData: OnboardUserInput,
        LocationData: locationInput,
        JobListData: jobListInput,
        GroupData: groupInput
      } = OnboardCustomerInput
      const creator = ObjectId.createFromHexString(context.data._id)
      if (blockedDomains.includes(customerInput.DomainName)) {
        throw new GraphQLError('Sub domain or customer id not allowed', {
          extensions: {
            code: '406'
          }
        })
      } else if (!await checkValidUser(context)) {
        throw new GraphQLError(UNAUTHORIZED, {
          extensions: {
            code: '403'
          }
        })
      } else {
        try {
          verifyUserPermissions(context)
          let db = await getDatabase(context)
          const commonDb = await getDatabase(context)
          if (customerInput.Tier !== STANDARD_TIER) {
            db = await isolatedDatabase(customerInput.DomainName)
          }
          const collection = await commonDb.collection(Customers)
          const customerInserted = await addCustomerMethod(customerInput, collection, context)
          const customerId = customerInserted.insertedId
          licenseInput = await formObjectIds(licenseInput)
          licenseInput.CustomerID = customerId
          customizationInput = await formObjectIds(customizationInput)
          customizationInput.CustomerID = customerId
          customizationTextInput = await formObjectIds(customizationTextInput)
          customizationTextInput.CustomerID = customerId
          jobListInput = await formObjectIds(jobListInput)
          jobListInput.CustomerID = customerId
          locationInput = await formObjectIds(locationInput)
          locationInput.CustomerID = customerId
          locationInput.IsActive = true;
          licenseInput.IsActive = true;
          licenseInput = await addCreateTimeStamp(licenseInput, creator)
          customizationInput.IsActive = true;
          customizationInput = await addCreateTimeStamp(customizationInput, creator)
          customizationTextInput.IsActive = true;
          customizationTextInput = await addCreateTimeStamp(customizationTextInput, creator)
          jobListInput.IsActive = true;
          jobListInput = await addCreateTimeStamp(jobListInput, creator)
          groupInput.IsActive = true;
          groupInput = await addCreateTimeStamp(groupInput, creator)
          locationInput = await addCreateTimeStamp(locationInput, creator)
          if (locationInput.Latitude && locationInput.Longitude) {
            locationInput.Coordinates = [locationInput.Longitude, locationInput.Latitude]
          }
          const roleData = await addRolesWithPermissionCustomerId(customerId, context, customerInput.Partner, customerInput.Tier, customerInput.DomainName)
          groupInput.RoleType = roleData
          groupInput = await formObjectIds(groupInput)
          groupInput.CustomerID = customerId
          const insertedGroup = await db.collection(Groups).insertOne(groupInput)
          let userInput = await formObjectIds(OnboardUserInput)
          userInput.CustomerID = customerId
          OnboardUserInput.IsActive = true;
          userInput = await addCreateTimeStamp(OnboardUserInput, creator)
          const themeGenerator = await generatePalette(customizationInput.themeCode)
          customizationInput.Hex50 = themeGenerator[50]
          customizationInput.Hex100 = themeGenerator[100]
          customizationInput.Hex200 = themeGenerator[200]
          customizationInput.Hex300 = themeGenerator[300]
          customizationInput.Hex400 = themeGenerator[400]
          customizationInput.Hex500 = themeGenerator[500]
          customizationInput.Hex600 = themeGenerator[600]
          customizationInput.Hex700 = themeGenerator[700]
          customizationInput.Hex800 = themeGenerator[800]
          customizationInput.Hex900 = themeGenerator[900]
          customizationInput.Rgb50 = themeGenerator.rgb50
          customizationInput.Rgb100 = themeGenerator.rgb100
          customizationInput.Rgb200 = themeGenerator.rgb200
          customizationInput.Rgb300 = themeGenerator.rgb300
          customizationInput.Rgb400 = themeGenerator.rgb400
          customizationInput.Rgb500 = themeGenerator.rgb500
          customizationInput.Rgb600 = themeGenerator.rgb600
          customizationInput.Rgb700 = themeGenerator.rgb700
          customizationInput.Rgb800 = themeGenerator.rgb800
          customizationInput.Rgb900 = themeGenerator.rgb900
          await db.collection(Customizations).insertOne(customizationInput)
          if (customerInput && customerInput.CustomerType.toLowerCase() === CUSTOMER_TYPE_CHECK) {
            // customizationTextInput.HowToLogoSection = {}
            customizationTextInput.HowToLogoSection.EmailAddressAssignedGrayscale = `bw-${customerInput.DomainName}@${process.env.domainName}`
            customizationTextInput.HowToLogoSection.EmailAddressAssignedCustomer = `${customerInput.DomainName}@${process.env.domainName}`
            customizationTextInput.HowToLogoSection.EmailAddressAssignedColor = `color-${customerInput.DomainName}@${process.env.domainName}`
          } else {
            // customizationTextInput.HowToLogoSection = {}
            customizationTextInput.HowToLogoSection.EmailAddressAssignedCustomer = `${customerInput.DomainName}@${process.env.domainName}`
          }
          customizationTextInput.HowToLogoSection.UploadURL = `https://${customerInput.DomainName}.${process.env.domainName}/${UPLOAD_PATH}`
          customizationTextInput.GlobalDecimalSetting = 2
          customizationTextInput.Currency = customizationTextInput.Currency
            ? customizationTextInput.Currency
            : "USD";
          const resCustomText = await db.collection(CustomizationTexts).insertOne(customizationTextInput)
          userInput.UserRole = roleData
          userInput.Password = userInput.Password ? userInput.Password : uuidv4()
          const normalPassword = userInput.Password
          userInput.GroupID = [insertedGroup.insertedId]
          const salt = await bcrypt.genSalt(10)
          userInput.Password = await bcrypt.hash(userInput.Password, salt)
          const resetToken =  crypto.randomBytes(32).toString('hex')
          userInput.ResetPasswordExpires = Date.now() + 3600000
          userInput.ResetPasswordToken= resetToken
          userInput.GroupQuotas = []
          const { insertedId } = await db.collection(Users).insertOne(userInput)
          userInput.Password = normalPassword
          userInput.insertedId = insertedId
          // No logic as license stays in the common database
          await commonDb.collection(Licenses).insertOne(licenseInput)
          const locationDataInsert = await db.collection(Locations).insertOne(locationInput)
          await db.collection(Locations).createIndex({ Coordinates: '2dsphere' })
          if (customerInput.Tier !== STANDARD_TIER) {
            locationInput._id = locationDataInsert.insertedId
            await commonDb.collection(Locations).insertOne(locationInput)
            await commonDb.collection(Locations).createIndex({ Coordinates: '2dsphere' })
          }
          jobListInput.DefaultAutomaticDeliveryLocation = locationDataInsert.insertedId
          await db.collection(JobLists).insertOne(jobListInput)
          await userMail(userInput)
          return ({
            message: 'Onboarded Customer successfully',
            statusCode: 200,
            customerId: customerId,
            customizationTextId: resCustomText.insertedId
          })
        } catch (error) {
          log.error(error)
        }
      }
    },

    async approvedSignup (_, { approvedSignupInput, CustomerID }, context, info) {
      const {
        IsApproved,
        ApprovedBy = ObjectId.createFromHexString(context.data._id)
      } = approvedSignupInput
      verifyUserAccess(context, CustomerID)
      const db = await getDatabase(context)
      await db.collection(Customers).updateOne({ _id: ObjectId.createFromHexString(CustomerID) }, {
        $set: {
          IsApproved: IsApproved,
          ApprovedBy: ApprovedBy
        }
      })
      const customerData = await db.collection(Customers).findOne({ _id: ObjectId.createFromHexString(CustomerID) }, {
        Email: 1,
        CustomerName: 1,
        Tier: 1
      })
      try {
        if (customerData.Tier === 'premium') {
          // await addPremiumDatabase(customerData.DomainName, customerData)
        } else {
          await db.collection(Customizations).insertOne({ CustomerID: ObjectId.createFromHexString(CustomerID) })
          await db.collection(CustomizationTexts).insertOne({ CustomerID: ObjectId.createFromHexString(CustomerID) })
        }
        const policy = await emailPolicy()
        const credentials = await getStsCredentials(policy)
        const accessParams = {
          accessKeyId: credentials.Credentials.AccessKeyId,
          secretAccessKey: credentials.Credentials.SecretAccessKey,
          sessionToken: credentials.Credentials.SessionToken
        }
        const htmlTemplate = await generateEJSTemplate({
          data: { CustomerName: customerData.CustomerName },
          filename: 'approved-customer'
        })
        await sendEmailV2({
          data: { html: htmlTemplate, to: customerData.Email },
          accessParams: accessParams
        })
        return ({
          message: APPROVAL_SIGNUP,
          statusCode: 200
        })
      } catch (error) {
        throw new Error(error)
      }
    },
    async updateCustomer (_, { updateCustomerInput, CustomerID }, context, info) {
      log.lambdaSetup(context, 'customers', 'updateCustomer')
      const {
        CustomerName
      } = updateCustomerInput
      verifyUserAccess(context, CustomerID)
      let { db, commonDb } = await getDualDb(context, CustomerID)
      dot.remove('CustomerID', updateCustomerInput)
      updateCustomerInput = await formObjectIds(updateCustomerInput)
      updateCustomerInput = await addUpdateTimeStamp(updateCustomerInput)
      const validateCustomerDuplicates = await db.collection(Customers).findOne({
        _id: { $ne: ObjectId.createFromHexString(CustomerID) },
        CustomerName: { $regex: `^${CustomerName}$`, $options: 'i' }, IsDeleted: false
      })
      if (validateCustomerDuplicates) {
        throw new GraphQLError(CUSTOMER_ALREADY_EXIST, {
          extensions: {
            code: '406'
          }
        })
      } else {
        let updateObject = await dot.dot(updateCustomerInput)
        dot.remove('DomainName', updateObject)
        updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id)
        updateObject = await formObjectIds(updateObject, true)
          await db.collection(Customers).updateOne({ _id: ObjectId.createFromHexString(CustomerID) }, {
            $set:
            updateObject })
        if (commonDb) {
          await commonDb.collection(Customers).updateOne({ _id: ObjectId.createFromHexString(CustomerID) }, {
            $set:
            updateObject
          })
        }
        return {
          message: 'Updated successfully',
          statusCode: 200
        }
      }
    },

    async customerDeleted (_, { IsDeleted, customerId }, context, info) {
      log.lambdaSetup(context, 'customers', 'customerDeleted' )
      try {
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!customerId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        verifyUserAccess(context, customerId)
        let { db, commonDb } = await getDualDb(context, customerId)
        const response = {
          message: 'Deleted Successfully',
          statusCode: 200
        }
        const customerData = await db.collection(Customers).findOne({ _id: ObjectId.createFromHexString(customerId) })
        if (customerData && customerData.DomainName === 'admin') {
          throw new GraphQLError(ADMIN_CUSTOMER_DELETE_NOT_ALLOWED, {
            extensions: {
              code: '400'
            }
          })
        } else {
          await db.collection(Customers).updateMany({ _id: ObjectId.createFromHexString(customerId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: ObjectId.createFromHexString(context.data._id), DeletedAt: new Date() } })
          commonDb
              ? await commonDb.collection(Customers).updateOne({ _id: ObjectId.createFromHexString(customerId) },
                  { $set: { IsDeleted: IsDeleted, DeletedBy: ObjectId.createFromHexString(context.data._id), DeletedAt: new Date() } })
              : []
          await db.collection(Locations).updateMany({ CustomerID: ObjectId.createFromHexString(customerId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: ObjectId.createFromHexString(context.data._id), DeletedAt: new Date() } })
          commonDb
              ? await commonDb.collection(Locations).updateMany({ CustomerID: ObjectId.createFromHexString(customerId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: ObjectId.createFromHexString(context.data._id), DeletedAt: new Date() } })
              : []
          await db.collection(Users).updateMany({ CustomerID: ObjectId.createFromHexString(customerId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: ObjectId.createFromHexString(context.data._id), DeletedAt: new Date() } })
          await db.collection(Groups).updateMany({ CustomerID: ObjectId.createFromHexString(customerId) }, { $set: { IsDeleted: IsDeleted } })
          await db.collection(Things).updateMany({ CustomerID: ObjectId.createFromHexString(customerId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: context.data._id, DeletedAt: new Date() } })
          await db.collection(Devices).updateMany({ CustomerID: ObjectId.createFromHexString(customerId) }, { $set: { IsDeleted: IsDeleted } })
          await db.collection(Roles).updateMany({ CustomerID: ObjectId.createFromHexString(customerId) }, { $set: { IsDeleted: IsDeleted } })
          await db.collection(Customizations).updateOne({ CustomerID: ObjectId.createFromHexString(customerId) }, { $set: { IsDeleted: IsDeleted } })
          await db.collection(JobLists).updateOne({ CustomerID: ObjectId.createFromHexString(customerId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: ObjectId.createFromHexString(context.data._id), DeletedAt: new Date() } })
          await commonDb.collection(Licenses).updateOne({ CustomerID: ObjectId.createFromHexString(customerId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: context.data._id, DeletedAt: new Date() } })
          await db.collection(PublicUploadsCollection).updateMany({ CustomerID: ObjectId.createFromHexString(customerId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: context.data._id, DeletedAt: new Date() } })
          await db.collection(Usages).updateMany({ CustomerID: ObjectId.createFromHexString(customerId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: context.data._id, DeletedAt: new Date() } })
          return response
        }
      } catch (error) {
        throw new Error(error.message)
      }
    },

    async customerStatus (_, { IsActive, customerId }, context) {
      log.lambdaSetup(context, 'customers', 'customerStatus' )
      try {
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!customerId) {
          throw new GraphQLError(REQUIRED_ID_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        verifyUserAccess(context, customerId)
        let { db, commonDb } = await getDualDb(context, customerId)
        const response = {
          message: IsActive ? 'Deactivated Successfully' : 'Activated Successfully',
          statusCode: 200
        }
        await db.collection(Customers).updateOne({ _id: ObjectId.createFromHexString(customerId) }, { $set: { IsActive: IsActive } })
        if (commonDb) {
          await commonDb.collection(Customers).updateOne({ _id: ObjectId.createFromHexString(customerId) }, { $set: { IsActive: IsActive } })
        }
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    }
  },

  Query: {
    async getCustomers (_, { paginationInput, customerIds, isPartner }, context) {
      log.lambdaSetup(context, 'customers', 'getCustomers' )
      let {
        pattern,
        pageNumber,
        limit,
        sort,
        status,
        sortKey,
        deleted = false
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
      const db = await getDatabase(context)
      const collection = await db.collection(Customers)
      if (tenantDomain !== 'admin' && customerIds.length === 0) {
        customerIds = customerIds.concat(customerId)
      }
      return await model.customers.getCustomersInformation({
        status,
        pattern,
        sort,
        pageNumber,
        limit,
        sortKey,
        customerIds,
        collection,
        deleted,
        isPartner,
        retrieveSubCustomers: false
      })
          .then(customerList => {
            customerList.total = customerList.total.length
            return customerList
          }).catch(error => {
            log.error(error)
            throw new Error(error)
          })
    },

    async getCustomer (_, { customerId }, context) {
      log.lambdaSetup(context, 'customers', 'getCustomer' )
      try {
        if (!customerId) {
          throw new GraphQLError('Required customer id is missing', {
            extensions: {
              code: '121'
            }
          })
        }
        verifyUserAccess(context, customerId)
        const db = await getDatabase(context)
        const customer = await db.collection(Customers).aggregate([
          {
            $match: {
              _id: ObjectId.createFromHexString(customerId)
            }
          },
          {
            $lookup: {
              from: 'Customers',
              localField: 'ParentCustomer',
              foreignField: '_id',
              pipeline: [
                { $project: { _id: 1, CustomerName: 1, DisplayName: 1, Description: 1 } }
              ],
              as: 'ParentCustomer'
            }
          },
          {
            $unwind: {
              path: '$ParentCustomer',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: 'Customers',
              localField: 'SubCustomers',
              foreignField: '_id',
              pipeline: [
                { $project: { _id: 1, CustomerName: 1, DisplayName: 1, Description: 1 } }
              ],
              as: 'SubCustomerData'
            }
          }
        ]).toArray()
        if (customer) {
          return customer[0]
        } else {
          throw new GraphQLError(CUSTOMER_NOT_FOUND, {
            extensions: {
              code: '121'
            }
          })
        }
      } catch (err) {
        throw new Error(err)
      }
    },

    async getSubCustomers(_, { paginationInput = {}, customerId }, context) {
      try {
        if (!customerId) {
          throw new GraphQLError('Required customer id is missing', {
            extensions: {
              code: '121'
            }
          })
        }
        let {
          pattern,
          pageNumber,
          limit,
          sort,
          status,
          sortKey,
          deleted = false
        } = paginationInput
        verifyUserAccess(context, customerId)
        const db = await getDatabase(context)
        const collection = await db.collection(Customers);
        return await model.customers
          .getCustomersInformation({
            status,
            pattern,
            sort,
            pageNumber,
            limit,
            sortKey,
            customerIds: customerId,
            collection,
            deleted,
            isPartner: false,
            retrieveSubCustomers: true,
          })
          .then((customerList) => {
            customerList.total = customerList.total.length;
            return customerList;
          })
          .catch((error) => {
            log.error(error);
            throw new Error(error);
          });
      } catch (err) {
        throw new Error(err);
      }
    },
  },
};

const addIds = async (data, context) => {
  data.CreatedBy = ObjectId.createFromHexString(context.data._id)
  data.IsDeleted = false
  data.IsApproved = true
  data.ApprovedBy = ObjectId.createFromHexString(context.data._id)
  // data.CustomerID = ObjectId.createFromHexString(customerId)
  return data
}

const addCustomerMethod = async (addCustomerInput, collection, context) => {
  const {
    CustomerName,
    DomainName
  } = addCustomerInput
  try {
    const validateCustomer = await collection.findOne({ $or: [{ DomainName: DomainName.toLowerCase() }, { CustomerName: { $regex: `^${CustomerName}$`, $options: 'i' } }], IsDeleted: false })
    if (validateCustomer) {
      if (validateCustomer.CustomerName &&
          validateCustomer.CustomerName === CustomerName) {
        throw new GraphQLError(CUSTOMER_ALREADY_EXIST, {
          extensions: {
            code: '406'
          }
        })
      } else if (validateCustomer.DomainName && validateCustomer.DomainName.toLowerCase() === DomainName.toLowerCase()) {
        throw new GraphQLError(DOMAIN_ALREADY_EXIST, {
          extensions: {
            code: '406'
          }
        })
      } else {
        throw new GraphQLError(DATABASE_ERROR, {
          extensions: {
            code: '406'
          }
        })
      }
    } else {
      addCustomerInput = await addIds(addCustomerInput, context)
      addCustomerInput.IsActive = true;
      addCustomerInput = await addCreateTimeStamp(addCustomerInput)
      if (addCustomerInput.Partner) {
        addCustomerInput.SubCustomerID = []
      }
      if (addCustomerInput.ParentCustomer) {
        addCustomerInput.ParentCustomer = ObjectId.createFromHexString(addCustomerInput.ParentCustomer)
      }
      addCustomerInput.DomainName = DomainName.toLowerCase()
      const addCustomer = await collection.insertOne(addCustomerInput)
      if (addCustomerInput.ParentCustomer) {
        await collection.updateOne({ _id: ObjectId.createFromHexString(addCustomerInput.ParentCustomer) }, { $push: { SubCustomerID: addCustomer.insertedId } })
        const parentCustomer = await collection.findOne({ _id: ObjectId.createFromHexString(addCustomerInput.ParentCustomer) })
        if (parentCustomer && parentCustomer.Tier !== STANDARD_TIER) {
          addCustomerInput._id = addCustomer.insertedId
          const premDb = await isolatedDatabase(parentCustomer.DomainName)
          await premDb.collection('Customers').insertOne(addCustomerInput)
          await premDb.collection('Customers').updateOne({ _id: ObjectId.createFromHexString(addCustomerInput.ParentCustomer) }, { $push: { SubCustomerID: addCustomer.insertedId } })
        }
      }
      if (addCustomerInput.Tier !== STANDARD_TIER) {
        const premDb = await isolatedDatabase(DomainName)
        addCustomerInput._id = addCustomer.insertedId
        await premDb.collection('Customers').insertOne(addCustomerInput)
        if (addCustomerInput.ParentCustomer) {
          await premDb.collection('Customers').updateOne({ _id: addCustomerInput.ParentCustomer }, { $push: { SubCustomerID: addCustomer.insertedId } })
        }
        return addCustomer
      } else {
        return addCustomer
      }
    }
  } catch (error) {
    throw new Error(error)
  }
}

const addRolesWithPermissionCustomerId = async (customerId, context, partner, tier, domain) => {
  let db = await getDatabase(context)
  const collection = await db.collection(Permissions)
  const customPermissionCollection = await db.collection(CustomPermissions)
  const condition = {}
  if (partner) {
    Object.assign(condition, { PartnerLevel: true, IsUserPortal: false  })
  } else {
    Object.assign(condition, { CustomerLevel: true, IsUserPortal: false })
  }
  const permissionIds = await collection.find(condition, { _id: 1}).toArray()
  const customPermissionIds = await customPermissionCollection.find(condition, { _id: 1 }).toArray()
  const mapPerms = await permissionIds.map(id => id._id)
  const mapCustomPerms = await customPermissionIds.map(id => id._id)
  const roleObj = {
    RoleName: 'admin',
    CustomerID: customerId,
    Permissions: mapPerms,
    IsDeleted: false,
    IsActive: true,
    CustomPermissions: mapCustomPerms
  }

  if (tier && tier !== STANDARD_TIER) {
    db = await isolatedDatabase(domain)
  }
  const roleCollection = await db.collection(Roles)
  const roleData = await roleCollection.insertOne(roleObj)
  return roleData.insertedId
}
