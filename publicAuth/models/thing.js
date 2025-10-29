// Things Model
const Things = {}

// Get user by public upload and status
Things.verifyActivationCode = async (activationCode, db, callback) => {
  const verifyActivateCodeData = await db.collection('Things').findOne({ ActivationCode: activationCode })
  callback(null, verifyActivateCodeData)
}

// Get user by public upload and status
Things.updateThingStatus = async (id, thingTagId, db, attributes, callback) => {
  let updateObj = {
    ActivationCode: null,
    ActivationStatus: 'ACTIVATED',
    ThingTagID: thingTagId
  }
  Object.assign(updateObj, attributes)
  if (attributes?.SerialNumber) {
    await db.collection('Things').updateOne({SerialNumber: attributes.SerialNumber}, {
      $set: {SerialNumber: null}
    })
  }
  if (attributes?.MacAddress) {
    await db.collection('Things').updateOne({MacAddress: attributes.MacAddress}, {
    $set: {MacAddress: null}
  })
  }
  const updateThingData = await db.collection('Things').updateOne({_id: id}, {
    $set: updateObj
  })
  callback(null, updateThingData)
}

// Get user by public upload and status
Things.getThingByTagId = async (thingTagId, db, callback) => {
  const getThingTagIdData = await db.collection('Things').findOne({ ThingTagID: thingTagId })
  if (getThingTagIdData) {
    callback(null, getThingTagIdData)
  } else {
    callback('Thing not found')
  }
}

// Get user by public upload and status
Things.getThingByTagIdAndUpdateVersion = async (thingTagId, db, configProperties, callback) => {
  const thingData = await db.collection('Things').findOne({ ThingTagID: thingTagId })
  if (configProperties) {
    await db.collection('Things').updateOne({ ThingTagID: thingTagId }, { $set: configProperties })
  }
  callback(null, thingData)
}

module.exports = Things
