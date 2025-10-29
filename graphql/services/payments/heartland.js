const crypto = require('crypto')
const { Sha1Algorithm } = require('../../config/config')

const roundToTwo = (value) => {
  if (value.length < 2) value = '0' + value
  return value
}

const getTimestamp = () => {
  const date = new Date()
  const year = date.getFullYear().toString()
  let month = `${date.getMonth() + 1}`
  month = roundToTwo(month)
  let day = date.getDate().toString()
  day = roundToTwo(day)
  let hours = date.getHours().toString()
  hours = roundToTwo(hours)
  let minutes = date.getMinutes().toString()
  minutes = roundToTwo(minutes)
  let seconds = date.getSeconds().toString()
  seconds = roundToTwo(seconds)

  const result = `${year}${month}${day}${hours}${minutes}${seconds}`
  return result
}

const generateSharedHash = (hashValue, sharedSecret) => {
  const hashSharedValues = `${hashValue}.${sharedSecret}`

  let hash = crypto.createHash(Sha1Algorithm)
  data = hash.update(hashSharedValues, 'utf8')
  const hashResult = data.digest('hex')
  return hashResult
}

const generateHash = (paymentConfig, argsData) => {
  const timestamp = getTimestamp()
  const orderID = crypto.randomBytes(64).toString('hex').slice(0, 25)
  const { Amount, Currency } = argsData
  const { MerchandID, SharedSecret } = paymentConfig

  const hashValues = `${timestamp}.${MerchandID}.${orderID}.${Amount}.${Currency}`
  let hash = crypto.createHash(Sha1Algorithm)
  data = hash.update(hashValues, 'utf8')
  const hashResult = data.digest('hex')
  const result = generateSharedHash(hashResult, SharedSecret)

  return { result, timestamp, orderID }
}

const generateHeartlandHash = async (paymentConfig, argsData) => {
  const { result: hash, timestamp, orderID} = generateHash(paymentConfig.Heartland, argsData)
  const response = {
    timestamp,
    orderID,
    hash,
  }
  return response
}

module.exports = generateHeartlandHash
