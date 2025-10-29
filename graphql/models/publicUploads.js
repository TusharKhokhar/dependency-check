// PublicUploads Model
const Promise = require('bluebird')
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')

const PublicUploads = {}

PublicUploads.getPublicUploadsInformation = ({
  status, pattern, sort, pageNumber, limit, sortKey,
  customerIds, locationIds, collection,
  releaseCode, libraryCard, guestName,
  email, text, isProcessed, isPrinted, userName
}) => {
  return new Promise((resolve, reject) => {
    const condition = { JobExpired: false, 'IsProcessedFileName.IsProcessed': true, IsJobProcessed: true }
    sort = sort === 'asc' ? 1 : -1
    sortKey = sortKey || 'CreatedAt'
    let sortingOrder = { [sortKey]: sort }
    Object.assign(sortingOrder, { 'JobList.NewFileNameWithExt': -1 })
    const skips = limit * (pageNumber - 1)
    if (customerIds && customerIds.length > 0) {
      customerIds = customerIds.map(custId => {
        return ObjectId.createFromHexString(custId)
      })
      Object.assign(condition, { CustomerID: { $in: customerIds } })
    }
    if (locationIds && locationIds.length > 0) {
      locationIds = locationIds.map(locId => {
        return ObjectId.createFromHexString(locId)
      })
      Object.assign(condition, { LocationID: { $in: locationIds } })
    }
    if (releaseCode) {
      Object.assign(condition, { ReleaseCode: releaseCode })
    }
    if (libraryCard) {
      Object.assign(condition, { LibraryCard: libraryCard })
    }
    if (guestName) {
      Object.assign(condition, { GuestName: guestName })
    }
    if (email) {
      Object.assign(condition, { Email: email })
    }
    if (text) {
      Object.assign(condition, { Text: text })
    }
    if (isProcessed) {
      Object.assign(condition, { IsProcessed: isProcessed })
    }
    if (userName) {
      Object.assign(condition, { Username: { $regex: `^${escapeRegex(userName)}$`, $options: 'i' }})
    }
    const searchCondition = { 'JobList.IsDeleted': false }
    const printedCondition = { }
    function escapeRegex(string) {
      if (typeof string !== 'string') return '';
      return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }
    if (isPrinted === true || isPrinted === false) {
      Object.assign(printedCondition, { $or: [{ 'JobList.IsPrinted': isPrinted }, { $and: [{ 'JobList.IsPrinted': { $exists: false } }, { IsPrinted: isPrinted }] }] })
      // Object.assign(searchCondition, {'JobList.IsPrinted': isPrinted})
    }
    const input = new RegExp(escapeRegex(pattern), "i");
    if (input || pattern) {
      Object.assign(searchCondition, {
        $or: [
          { ReleaseCode: new RegExp(pattern, 'i') },
          { LibraryCard: new RegExp(pattern, 'i') },
          { UploadedFrom: new RegExp(pattern, 'i') },
          { ComputerName: new RegExp(pattern, 'i') },
          { GuestName: new RegExp(pattern, 'i') },
          { Email: new RegExp(pattern, 'i') },
          { 'JobList.OriginalFileNameWithExt': new RegExp(input, 'i') },
          { Text: new RegExp(pattern, 'i') }
        ]
      })
  }
    const query = [
      {
        $match: condition
      },
      {
        $unwind: {
          path: '$JobList',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $match: printedCondition
      },
      {
        $match: searchCondition
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
    let totalQuery = query
    totalQuery = totalQuery.concat({ $count: 'total' })
    Promise.props({
      publicUpload: pageNumber && limit
        ? collection.aggregate(query, { collation: { locale: 'en' } })
          .sort(sortingOrder)
          .skip(skips)
          .limit(limit).toArray()
        : collection.aggregate(query, { collation: { locale: 'en' } })
          .sort(sortingOrder).toArray(),
      total: collection.aggregate(totalQuery).toArray()
    }).then(results => {
      results.total = results.total[0] &&
            results.total[0].total
        ? results.total[0].total
        : 0
      resolve(results)
    }).catch(err => {
      console.log(err)
      reject(err)
    })
  })
}

// Get user by PublicUpload and status
PublicUploads.updateReleaseCode = async (releaseCode, db, collection) => {
  await collection.updateOne({ ReleaseCode: releaseCode }, { $set: { IsPrinted: true } })
}

// Get user by PublicUpload and status
PublicUploads.updateFilePrintHistory = async (releaseCode, fileName, db, collection, deleteJobOrNot) => {
  const response = await collection.findOneAndUpdate({ ReleaseCode: releaseCode }, { $set: { IsPrinted: true } })
  let update = {
    'JobList.$.IsPrinted': true
  }
  if (deleteJobOrNot) {
    Object.assign(update, {'JobList.$.IsDeleted': true})
  }
  await collection.updateOne({ 'JobList.NewFileNameWithExt': fileName }, {
    $set: update,
    $inc: { 'JobList.$.PrintCounter': 1 }
  }, { multi: false })
  return response.value
}

// Export PublicUploads model
module.exports = PublicUploads
