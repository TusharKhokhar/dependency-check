const { localDatabase } = require('../config/config.js')
const ERROR = require('../helpers/error-keys')
const { setErrorResponse } = require('../services/api-handler')
const { excludedRoutes } = require('../config/config')

module.exports.fetchTierAndCustomerDetails = (event, context, next) => {
  if (process.env.environment && process.env.environment === 'server') {
    console.log('DB Name', process.env.dbName)
  } else {
    process.env.dbName = localDatabase
  }
  const parts = event.headers.origin ? event.headers.origin.split('.')[0].split('/')[2] : []
  if (process.env.environment && process.env.environment === 'server') {
    if (parts[0] && parts[0] === 'www') {
      setErrorResponse(null, ERROR.CUSTOMER_NOT_FOUND, context)
    } else {
      event.headers.subdomain = event.headers.subdomain ? event.headers.subdomain : parts
      if (event.path && excludedRoutes.indexOf(event.path) !== -1) {
        return next()
      } else if (!event.headers.subdomain) {
        setErrorResponse(null, ERROR.CUSTOMER_NOT_FOUND, context)
      } else {
        event.headers.mainDomain = 'tbs'
        if (!event.headers.tier) {
          event.headers.dbName = `${process.env.dbName}`
        } else {
          event.headers.dbName = event.headers.tier === 'premium' ? `${process.env.dbName}-${event.headers.subdomain}` : process.env.dbName
        }
      }
    }
  } else {
    event.headers.subdomain = event.headers.subdomain ? event.headers.subdomain : parts
    if (event.path && excludedRoutes.indexOf(event.path) !== -1) {
      return next()
    } else if (!event.headers.subdomain) {
      setErrorResponse(null, ERROR.CUSTOMER_NOT_FOUND, context)
    } else {
      event.headers.mainDomain = parts[1]
      event.headers.dbName = event.headers.tier === 'standard' ? localDatabase : `${localDatabase}-${event.headers.subdomain}`
    }
  }
  if (!event.headers.tier) {
    event.headers.tier = 'standard'
    return next()
  } else {
    return next()
  }
}
