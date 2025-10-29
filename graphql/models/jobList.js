const Promise = require('bluebird')
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')

// JobLists Model
const JobLists = {}

/**
 * Method to get all JobListInformation
 */

JobLists.getJobListsInformation = ({ status, pattern, sort, pageNumber, limit, sortKey, customerIds, collection }) => {
  return new Promise((resolve, reject) => {
    const condition = { IsDeleted: false }
    sort = sort === 'dsc' ? -1 : 1
    sortKey = sortKey || 'JobList'
    const skips = limit * (pageNumber - 1)
    if (customerIds && customerIds.length > 0) {
      customerIds = customerIds.map(custId => {
        return ObjectId.createFromHexString(custId)
      })
      Object.assign(condition, { CustomerID: { $in: customerIds } })
    }
    if (pattern) {
      Object.assign(condition, {
        $or: [
          { JobList: new RegExp(pattern, 'i') },
          { Tags: new RegExp(pattern, 'i') }
        ]
      })
    }
    if (status) {
      status = status === 'true'
      Object.assign(condition, { IsDeleted: status })
    }
    const query = [
      {
        $match: condition
      },
      {
        $lookup: {
          from: 'Locations',
          localField: 'DefaultAutomaticDeliveryLocation',
          foreignField: '_id',
          pipeline: [
            { $project: { _id: 1, Location: 1 } }
          ],
          as: 'LocationData'
        }
      },
      {
        $unwind: {
          path: '$LocationData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'Things',
          localField: 'DefaultLmsValidateThing',
          foreignField: '_id',
          pipeline: [
            { $project: { _id: 1, Thing: 1 } }
          ],
          as: 'ThingData'
        }
      },
      {
        $unwind: {
          path: '$ThingData',
          preserveNullAndEmptyArrays: true
        }
      }
    ]
    Promise.props({
      jobList: limit && pageNumber
        ? collection.aggregate(query)
        // .collation({'locale':'en'})
          .sort({ [sortKey]: sort })
          .skip(skips)
          .limit(limit).toArray()
        : collection.aggregate(query).toArray(),
      total: collection.find(condition).toArray()
    }).then(results => {
      resolve(results)
    }).catch(err => {
      console.log('eeeeee***',err)
      reject(err)
    })
  })
}

// Export JobLists model
module.exports = JobLists
