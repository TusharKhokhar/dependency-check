const Promise = require('bluebird')

// Settings Model
const Settings = {}

/**
 * Method to get all SettingInformation
 */

Settings.getSettingsInformation = ({
  status, pattern, sort,
  pageNumber, limit, sortKey, collection
}) => {
  return new Promise((resolve, reject) => {
    const condition = { IsDeleted: false }
    sort = sort === 'dsc' ? -1 : 1
    sortKey = sortKey || 'Setting'
    const skips = limit * (pageNumber - 1)
    if (pattern) {
      Object.assign(condition, {
        $or: [
          { Setting: new RegExp(pattern, 'i') },
          { Tags: new RegExp(pattern, 'i') }
        ]
      })
    }

    if (status) {
      status = status === 'true'
      Object.assign(condition, { IsDeleted: status })
    }
    Promise.props({
      setting: collection.find(condition)
        .sort({ [sortKey]: sort })
        .skip(skips)
        .limit(limit).toArray(),
      total: collection.find(condition).toArray()
    }).then(results => {
      resolve(results)
    }).catch(err => {
      console.log(err)
      reject(err)
    })
  })
}

// Export Settings model
module.exports = Settings
