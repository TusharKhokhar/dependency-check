const Express = require('express')
const BodyParser = require('body-parser')
const cors = require('cors')
const serverless = require('serverless-http')
const Morgan = require('morgan')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const csrf = require('csurf')
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
App.use(BodyParser.json({ limit: '50mb' })) // Set request size

// create application/x-www-form-urlencoded parser
App.use(BodyParser.urlencoded({ limit: '50mb', extended: true }))
App.use((req, res, next) => {
  res.set('Strict-Transport-Security', 'max-age=31536000')
  res.set('X-XSS-Protection', '1; mode=block')
  next()
})

// Use the custom routes
require('./routes/index')(App)
App.use(csrf({ cookie: true }))

App.set('port', 3001)
App.set('host', 'localhost')
App.listen(App.get('port'), () => {
  console.log(`Server started at ${App.get('host')}:${App.get('port')}`)
})

module.exports.handler = serverless(App)
