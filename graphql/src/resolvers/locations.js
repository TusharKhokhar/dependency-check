const model = require('../../models/index')
const {
  LOCATION_ALREADY_EXIST, REQUIRED_ID_MISSING, REQUIRED_INPUT_MISSING, INVALID_STATUS,
  DISASSOCIATE_BEFORE_DELETION
} = require('../../helpers/error-messages')
const dot = require('dot-object')
const { GraphQLError } = require('graphql')
const { Locations, Customers, CustomizationTexts} = require('../../models/collections')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, getDualDb, verifyUserAccess,
  getDatabaseOneCustomer
} = require('../../helpers/util')
const { findReference } = require('../../helpers/referenceFinder')
const { customerSecurity } = require('../../utils/validation')
const {STANDARD_TIER} = require("../../helpers/constants");
const {isolatedDatabase} = require("../../config/dbHandler");
const {domainName} = require("../../config/config");
const CustomLogger = require("../../helpers/customLogger");
const { locationData } = require('../../helpers/xlsColumns')
const { Parser } = require('json2csv')
const { formatLocations } = require('../../helpers/formatLocations')
const log = new CustomLogger()
dot.keepArray = true

module.exports = {
  Mutation: {
    async addLocation (_, { addLocationInput }, context, info) {
      log.lambdaSetup(context, 'locations', 'addLocation')
      const {
        Label,
        Location,
        Description,
        Address,
        City,
        Searchable,
        State,
        Zip,
        Geolocation,
        Latitude,
        Longitude,
        TimeZone,
        CustomerID,
        AreaIDs,
        Customization,
        ShortName,
        Rule,
        Tags,
        CurrencyCode,
        CreatedBy = ObjectId.createFromHexString(context.data._id),
        IsDeleted,
        IsActive
      } = addLocationInput
      let newLocation = {
        Label: Label,
        Location: Location,
        Description: Description,
        Address: Address,
        City: City,
        Searchable: Searchable,
        State: State,
        Zip: Zip,
        Geolocation: Geolocation,
        TimeZone: TimeZone,
        CustomerID: ObjectId.createFromHexString(CustomerID),
        AreaIDs: AreaIDs,
        Customization: Customization,
        Latitude: Latitude,
        Longitude: Longitude,
        Coordinates: [Longitude, Latitude],
        Rule: Rule,
        Tags: Tags,
        CurrencyCode: CurrencyCode,
        CreatedBy: CreatedBy,
        ShortName: ShortName,
        IsDeleted: IsDeleted,
        IsActive: IsActive,
      }
      newLocation = formObjectIds(newLocation)
      newLocation = addCreateTimeStamp(newLocation)
      try {
        verifyUserAccess(context, CustomerID)
        let { db, commonDb } = await getDualDb(context, CustomerID)
        const {errorMessage, valid } = await validateLocationShortName(commonDb, ShortName, CustomerID, null)
        let customerDetails = await db.collection(Customers).findOne({_id: ObjectId.createFromHexString(CustomerID)})
        if (!valid && ShortName) {
          throw new GraphQLError(errorMessage, {
            extensions: {
              code: '406'
            }
          })
        } else {
          const validateLocation = await db.collection(Locations).findOne({
            CustomerID: ObjectId.createFromHexString(CustomerID),
            Location: { $regex: `^${Location}$`, $options: 'i' },
            IsDeleted: false
          })
          if (validateLocation) {
            throw new GraphQLError(LOCATION_ALREADY_EXIST, {
              extensions: {
                code: '406'
              }
            })
          } else {
            if (newLocation?.ShortName) {
              newLocation.AdvancedEmails = {
                AdvancedEmailAlias : [
                  {
                    CombinationType : 'default',
                    Email : `${ShortName}-${customerDetails.DomainName}@${domainName}`,
                    AliasEmails : ''
                  }
                ],
                  Enabled : true
              }
            }
            const { insertedId } = await db.collection(Locations).insertOne(newLocation)
            await db.collection(Locations).createIndex({ Coordinates: '2dsphere' })
            if (customerDetails.Tier !== STANDARD_TIER) {
              newLocation._id = insertedId
              await commonDb.collection(Locations).insertOne(newLocation)
              await commonDb.collection(Locations).createIndex({ Coordinates: '2dsphere' })
              return await db.collection(Locations).findOne({ _id: insertedId })
            } else {
              return await db.collection(Locations).findOne({ _id: insertedId })
            }
          }
        }
      } catch (error) {
        throw new Error(error)
      }
    },

    async updateLocation (_, { updateLocationInput, locationId }, context, info) {
      log.lambdaSetup(context, 'locations', 'updateLocation')
      const {
        Location,
        CustomerID,
        ShortName
      } = updateLocationInput
      verifyUserAccess(context, CustomerID)
      let { db, commonDb } = await getDualDb(context, CustomerID)
      const { errorMessage, valid } = await validateLocationShortName(commonDb, ShortName, CustomerID, locationId)
      if (!valid) {
        throw new GraphQLError(errorMessage, {
          extensions: {
            code: '406'
          }
        })
      } else {
        let customerDetails = await db.collection(Customers).findOne({_id: ObjectId.createFromHexString(CustomerID)})
        dot.remove('CustomerID', updateLocationInput)
        updateLocationInput = await addUpdateTimeStamp(updateLocationInput)
        const validateLocationDuplicacy = await db.collection(Locations).findOne({
          _id: { $ne: ObjectId.createFromHexString(locationId) },
          Location: { $regex: `^${Location}$`, $options: 'i' },
          CustomerID: ObjectId.createFromHexString(CustomerID),
          IsDeleted: false
        })
        const locationDetails = await db.collection(Locations).findOne({
          _id: ObjectId.createFromHexString(locationId),
          CustomerID: ObjectId.createFromHexString(CustomerID),
          IsDeleted: false
        })
        if (validateLocationDuplicacy) {
          throw new GraphQLError(LOCATION_ALREADY_EXIST, {
            extensions: {
              code: '121'
            }
          })
        } else
          if (!locationDetails.ShortName && ShortName){
            updateLocationInput.ShortName = ShortName.toLowerCase()
            updateLocationInput.AdvancedEmails = {
                AdvancedEmailAlias : [
                  {
                    CombinationType : 'default',
                    Email : `${updateLocationInput.ShortName}-${customerDetails.DomainName}@${domainName}`,
                    AliasEmails : ''
                  }
                ],
                Enabled : true
              }
          } else if (locationDetails.ShortName) {
            dot.remove('ShortName', updateLocationInput)
          } else {
            log.info('No short name in update request')
          }
          if (updateLocationInput.Latitude && updateLocationInput.Longitude) {
            updateLocationInput.Coordinates = [updateLocationInput.Longitude, updateLocationInput.Latitude]
          }
          let updateObject = await dot.dot(updateLocationInput)
          updateObject = await formObjectIds(updateObject)
          updateObject.UpdatedBy = ObjectId.createFromHexString(context.data._id)
          await  db.collection(Locations).updateOne({ _id: ObjectId.createFromHexString(locationId) }, {
            $set:
            updateObject
          })
          await db.collection(Locations).createIndex({ Coordinates: '2dsphere' })
          if (customerDetails.Tier !== STANDARD_TIER) {
            await commonDb.collection(Locations).createIndex({ Coordinates: '2dsphere' })
            await commonDb.collection(Locations).updateOne({ _id: ObjectId.createFromHexString(locationId) }, {
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

    async locationDeleted (_, { IsDeleted, locationId, customerId }, context, info) {
      log.lambdaSetup(context, 'locations', 'locationDeleted')
      try {
        if (IsDeleted !== true) {
          throw new GraphQLError(INVALID_STATUS, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!locationId) {
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
        const errorSet = await findReference('locations', locationId, db)
        if (errorSet.length > 0) {
          const newErrorSet = errorSet.join(', ')
          throw new GraphQLError(`${DISASSOCIATE_BEFORE_DELETION}${newErrorSet}`, {
            extensions: {
              code: '400'
            }
          })
        } else {
          await db.collection(Locations).updateOne({ _id: ObjectId.createFromHexString(locationId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: ObjectId.createFromHexString(context.data._id), DeletedAt: new Date() } })
          if (commonDb) {
            await commonDb.collection(Locations).updateOne({ _id: ObjectId.createFromHexString(locationId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: ObjectId.createFromHexString(context.data._id), DeletedAt: new Date() } })
          }
          return response
        }
      } catch (error) {
        log.error(error);
        throw new Error(error.message)
      }
    },

    async locationStatus (_, { IsActive, locationId, customerId }, context) {
      log.lambdaSetup(context, 'locations', 'locationStatus')
      try {
        if (IsActive === null || IsActive === undefined) {
          throw new GraphQLError(REQUIRED_INPUT_MISSING, {
            extensions: {
              code: '121'
            }
          })
        }
        if (!locationId) {
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
        let { db, commonDb } = await getDualDb(context, customerId)
        await db.collection(Locations).updateOne({ _id: ObjectId.createFromHexString(locationId) }, { $set: { IsActive: IsActive } })
        if (commonDb) {
          await commonDb.collection(Customers).updateOne({ _id: ObjectId.createFromHexString(customerId) }, { $set: { IsActive: IsActive } })
        }
        return response
      } catch (error) {
        throw new Error(error.message)
      }
    },
    async generateEmailForLocation (_, { customerId, combination, locationId }, context) {
      log.lambdaSetup(context, 'locations', 'generateEmailForLocation')
      try {
        verifyUserAccess(context, customerId)
        combination = combination.toLowerCase()
        let { db, commonDb } = await getDualDb(context, customerId)
        const customerData = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerId) }, { DomainName: 1, Tier: 1 })
        const locationInfo = await db.collection(Locations).findOne({ CustomerID: ObjectId.createFromHexString(customerId), _id: ObjectId.createFromHexString(locationId), 'AdvancedEmails.AdvancedEmailAlias.CombinationType': combination })
        if (locationInfo) {
          throw new Error('Email combination already exists')
        } else {
          const locationDetails = await db.collection(Locations).findOne({ CustomerID: ObjectId.createFromHexString(customerId), _id: ObjectId.createFromHexString(locationId)})
          let obj = {
            CombinationType: combination,
            Email: `${combination.split('_').join('-')}-${locationDetails.ShortName}-${customerData.DomainName}@${domainName}`,
            AliasEmails: null
          }
          if(locationDetails?.AdvancedEmails?.AdvancedEmailAlias && locationDetails.AdvancedEmails.AdvancedEmailAlias.length > 0){
            await db.collection(Locations).updateOne({ CustomerID: ObjectId.createFromHexString(customerId), _id: ObjectId.createFromHexString(locationId) },
              { $push: {'AdvancedEmails.AdvancedEmailAlias': obj  }, $set: {'AdvancedEmails.Enabled': true} })
            if (commonDb && customerData.Tier !== STANDARD_TIER) {
              await commonDb.collection(Locations).updateOne({ CustomerID: ObjectId.createFromHexString(customerId), _id: ObjectId.createFromHexString(locationId) },
                { $push: {'AdvancedEmails.AdvancedEmailAlias': obj  }, $set: {'AdvancedEmails.Enabled': true} })
            }
          } else {
            await db.collection(Locations).updateOne({ CustomerID: ObjectId.createFromHexString(customerId), _id: ObjectId.createFromHexString(locationId) },
              { $set: {'AdvancedEmails.AdvancedEmailAlias': [obj], 'AdvancedEmails.Enabled': true  } })
            if (commonDb && customerData.Tier !== STANDARD_TIER){
              await commonDb.collection(Locations).updateOne({ CustomerID: ObjectId.createFromHexString(customerId), _id: ObjectId.createFromHexString(locationId) },
                { $set: {'AdvancedEmails.AdvancedEmailAlias': [obj], 'AdvancedEmails.Enabled': true  } })
            }
          }
          return {
            message: 'Generated successfully',
            statusCode: 200
          }
        }
      } catch (error) {
        throw new Error(error.message)
      }
    }
  },

  Query: {
    async getLocations (_, { paginationInput, customerIds }, context) {
      log.lambdaSetup(context, 'locations', 'getLocations')
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
      const db = await getDatabase(context)
      const collection = db.collection(Locations)
      const customerId = context.data.customerIdsFilter
      const tenantDomain = context.data.TenantDomain
      pageNumber = pageNumber ? parseInt(pageNumber) : undefined
      limit = limit ? parseInt(limit) : undefined
      customerIds = customerIds || []
      const secureIds = await customerSecurity(tenantDomain, customerId, customerIds, context)
      if (secureIds) {
        customerIds = secureIds
      }
      return await model.locations.getLocationsInformation({
        status,
        pattern,
        sort,
        pageNumber,
        limit,
        sortKey,
        customerIds,
        collection,
        deleted
      }).then(async locationList => {
        // locationList.total = locationList.total.length
        const locationData = []
        locationList?.location?.forEach(location => {
          const loc = addAdvanceEmail(location)
          locationData.push(loc)
        })
        let index = 0
        for (const location of locationData) {
          const openTimeArray = location && location.Rule && location.Rule.OpenTimes &&
                location.Rule.OpenTimes.DayHours
            ? location.Rule.OpenTimes.DayHours
            : []
            locationData[index].openTimesLocationFormatted = await formatLocations(openTimeArray)
          index++
          
        }
        locationList.location = locationData
        return locationList
      }).catch(err => {
        log.error(err)
        throw new Error(err)
      })
    },

    async getLocation (_, { locationId, customerId }, context) {
      log.lambdaSetup(context, 'locations', 'getLocation')
      try {
        verifyUserAccess(context, customerId)
        const db = await getDatabase(context)
        const locationData = await db.collection(Locations).findOne({ _id: ObjectId.createFromHexString(locationId) })
        locationData.CustomerData = await db.collection(Customers).findOne({_id: ObjectId.createFromHexString(customerId)})
        return await addAdvanceEmail(locationData)
      } catch (err) {
        console.log('error: ',err);
        throw new Error(err)
      }
    },

    async getLocationsByCustomerID (_, { customerId }, context) {
      log.lambdaSetup(context, 'locations', 'getLocationsByCustomerID')
      try {
        verifyUserAccess(context, customerId)
        const db = await getDatabase(context)
        return await db.collection(Locations).find({ CustomerID: ObjectId.createFromHexString(customerId) }).toArray()
      } catch (err) {
        throw new Error(err)
      }
    },

    async importLocation (_, { customerId }, context) {
      log.lambdaSetup(context, 'locations', 'importLocation')
      try {
        verifyUserAccess(context, customerId)
        const finalReport = [{
          Location: 'Location Name',
          Description: 'Description',
          Tags: 'Tags',
          Address: 'Address',
          City: 'City',
          State: 'State',
          Country: 'Country',
          ZipCode: 'ZipCode',
          OpenHoursOne: '9:00 AM',
          ClosingHoursOne: '9:00 PM',
          DayOne: 'Monday',
          OpenHoursTwo: '9:00 AM',
          ClosingHoursTwo: '9:00 PM',
          DayTwo: 'Tuesday',
          OpenHoursThree: '9:00 AM',
          ClosingHoursThree: '9:00 PM',
          DayThree: 'Wednesday',
          OpenHoursFour: '9:00 AM',
          ClosingHoursFour: '9:00 PM',
          DayFour: 'Thursday',
          OpenHoursFive: '9:00 AM',
          ClosingHoursFive: '9:00 PM',
          DayFive: 'Friday',
          OpenHoursSix: '9:00 AM',
          ClosingHoursSix: '9:00 PM',
          DaySix: 'Saturday',
          OpenHoursSeven: '9:00 AM',
          ClosingHoursSeven: '9:00 PM',
          DaySeven: 'Sunday',
          CurrencyCode: 'USD',
          Searchable: 'true'
        }]
        const json2csvParser = new Parser({ fields: locationData, del: ',' })
        const finalCsvData = await json2csvParser.parse(finalReport)
        const template =  Buffer.from(finalCsvData).toString('base64') 
        return {
          message: template,
          statusCode: 200
        }
      } catch (e) {
        log.error(e)
        throw new Error(e)
      }
    }
  }
}

const validateLocationShortName = async (db, shortName, customerId, locationId) => {
  if (shortName) {
    let query = {CustomerID: ObjectId.createFromHexString(customerId), ShortName: shortName, IsDeleted: false}
    if (locationId) {
      Object.assign(query, {_id: {$ne: ObjectId.createFromHexString(locationId)}})
    }
    const records = await db.collection(Locations).findOne(query)
    if (records) {
      return {errorMessage: 'Shortname already exists', valid: false}
    } else {
      return {errorMessage: '', valid: true}
    }
  } else {
    return {errorMessage: '', valid: true}
  }
}

const addAdvanceEmail = (locationData) => {
  const customerDetails = locationData?.CustomerData
  if (!locationData?.AdvancedEmails && locationData?.ShortName) {
    locationData.AdvancedEmails = {
      AdvancedEmailAlias : [
        {
          CombinationType : 'default',
          Email : `${locationData.ShortName}-${customerDetails.DomainName}@${domainName}`,
          AliasEmails : ''
        }
      ],
      Enabled : true
    }
  } else if (locationData?.AdvancedEmails) {
    const checkDefaultLocation = locationData?.AdvancedEmails?.AdvancedEmailAlias?.map(email => email.CombinationType === 'default') || false
    if (!checkDefaultLocation.includes(true) && locationData?.ShortName) {
      locationData.AdvancedEmails.AdvancedEmailAlias.push( {
        CombinationType : 'default',
        Email : `${locationData.ShortName}-${customerDetails.DomainName}@${domainName}`,
        AliasEmails : ''
      })
      }
  }
  return locationData
}
