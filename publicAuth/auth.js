const Express = require('express')
const BodyParser = require('body-parser')
const cors = require('cors')
// global.fetch = require('node-fetch')
const serverless = require('serverless-http')
const Morgan = require('morgan')
const multiRegion = require('./helpers/multi-region-helper')
const validateRequest = require('./services/token-interceptor')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const csrf = require('csurf')
const { excludedRoutes } = require('./config/config')
const { validatePaymentRoutes } = require('./helpers/util')
// Init App
const App = Express()

// Creates server logs
App.use(Morgan(':method :url :status :response-time ms - :res[content-length]'))

// Cross origin
App.use(cors('*'))
App.use(helmet())
App.use(cookieParser())
// BodyParser middleware
// Create application/json parser
App.use(BodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf
  }, limit: '50mb'
})) // Set request size

// create application/x-www-form-urlencoded parser
App.use(BodyParser.urlencoded({ limit: '50mb', extended: true }))
App.use((req, res, next) => {
  res.set('Strict-Transport-Security', 'max-age=31536000')
  res.set('X-XSS-Protection', '1')
  next()
})

App.use(async (req, res, next) => {
  if (validatePaymentRoutes(excludedRoutes, req.originalUrl)) return next()
  if (req.originalUrl.includes('/public/logo')) return next()
  await validateRequest.validateRequest(req, res, next)
})

App.use((req, res, next) => {
  multiRegion.fetchTierAndCustomerDetails(req, res, next)
})

// Use the custom routes
require('./routes/index')(App)

App.use(csrf({ cookie: true }))

// Set port
App.set('port', 4000)
App.set('host', 'localhost')
App.listen(App.get('port'), () => {
  console.log(`Server started at ${App.get('host')}:${App.get('port')}`)
})

module.exports.handler = serverless(App)
