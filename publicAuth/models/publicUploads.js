const { getDb } = require('../config/db')
const { getObjectId: ObjectId } = require("../helpers/objectIdConvertion")

// PublicUploads Model
const PublicUploads = {}

// Get user by public upload and status
PublicUploads.postPublicUploads = async (data, db, callback) => {
  await db.collection('PublicUploads').createIndex( { 'ExpireJobRecord': 1 }, { expireAfterSeconds: 7200 } )
  const postPublicUploadData = await db.collection('PublicUploads').insertOne(data)
  callback(null, postPublicUploadData)
}

// Get user by public upload and status
PublicUploads.updatePublicUploads = async (data, id, db, callback) => {
  const updatePublicUploadData = await db.collection('PublicUploads').findOneAndUpdate({ _id: ObjectId.createFromHexString(id) }, { $set: data })
  callback(null, updatePublicUploadData)
}

// Get user by public upload and status
PublicUploads.getPublicUpload = async (releaseCode, db, customerId, callback) => {
  const getPublicUploadData = await db.collection('PublicUploads').findOne({ ReleaseCode: releaseCode })
  callback(null, getPublicUploadData)
}

// Get user by public upload and status
PublicUploads.getPublicUploadAll = async (releaseCode, db, callback) => {
  const getPublicUploadAllData = await db.collection('PublicUploads').findOne({ ReleaseCode: releaseCode })
  callback(null, getPublicUploadAllData)
}

// Get user by public upload and status
PublicUploads.getPublicUploadByPattern = async (condition, db, callback) => {
  Object.assign(condition, {
    'IsProcessedFileName.IsProcessed': true,
    'JobList.UploadStatus': true
  })
  const publicUploadPatternData = await db.collection('PublicUploads').find(condition).toArray()
  callback(null, publicUploadPatternData)
}

PublicUploads.updateCode = (customerId, fileName, callback) => {
  getDb().then(async instance => {
    const updateCodeData = await instance.collection('PublicUploads').updateOne({ 'IsProcessedFileName.FileName': fileName }, {
      $set: {
        'IsProcessedFileName.$.IsProcessed': true
      }
    })
    callback(null, updateCodeData)
  }).catch(error => {
    callback(error, null)
  })
}

PublicUploads.updateAll = (allIds, db, callback) => {
  getDb().then(async instance => {
    const updateAllData = await instance.collection('PublicUploads').updateMany({ _id: { $in: allIds } }, { $set: { IsDelivered: true } })
    callback(null, updateAllData)
  }).catch(error => {
    callback(error, null)
  })
}

module.exports = PublicUploads
