const { ApolloServer } = require('@apollo/server')
const { GraphQLError } = require('graphql')
const { expressMiddleware } = require('@as-integrations/express5')
const serverlessExpress = require('@vendia/serverless-express')
const express = require('express')
const { json } = require('body-parser')
const cors = require('cors')
const csrf = require('csurf')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')

const {
  UsageSchema,
  CustomerSchema,
  rootSchema,
  CustomizationSchema,
  locationSchema,
  areaSchema,
  groupSchema,
  deviceSchema,
  thingSchema,
  settingSchema,
  loggingSchema,
  userSchema,
  bucketUploadSchema,
  customizationTextSchema,
  licenseSchema,
  permissionSchema,
  roleSchema,
  jobListSchema,
  paymentSchema,
  profileSchema,
  validatorSchema,
  dropdownSchema,
  customPermissionSchema,
  publicUploadSchema,
  partnerSchema,
  authProviderSchema,
  languagesSchema,
  versionSchema,
  accountSyncSchema,
  accountSchema,
  protonSchema,
  BillingServicesSchema,
  papersizesSchema, auditLogsSchema, faxesSchema, ippSessionSchema, thirdPartySoftware, emailSchema,
  handWriteRecognitionSchema, restorePicturesSchema, illiadSchema, smartphonesSchema, FTPSchema,
  ThirdPartySupportedLanguagesSchema, AbbySchema, faxSchema, networkSchema, textTranslationSchema,
  audioSchema
} = require('./src/typeDef')
const resolvers = require('./src/resolvers')
const { validateToken } = require('./services/token-interceptor')
const { Stage } = require('./config/config')
const { getFragmentOperation, toPascalCase, logGraphQLOperation } = require('./helpers/util')
const depthLimit = require("graphql-depth-limit");

// Performance optimization
let counter = 0

const server = new ApolloServer({
  typeDefs: [rootSchema, UsageSchema, CustomerSchema, CustomizationSchema, locationSchema, areaSchema, groupSchema,
    thingSchema, deviceSchema, settingSchema, loggingSchema, userSchema, bucketUploadSchema, customizationTextSchema,
    licenseSchema, permissionSchema, roleSchema, jobListSchema, paymentSchema, profileSchema, validatorSchema, dropdownSchema,
    customPermissionSchema, publicUploadSchema, partnerSchema, authProviderSchema, versionSchema, languagesSchema,
    papersizesSchema, auditLogsSchema, faxesSchema, ippSessionSchema, accountSyncSchema, protonSchema, accountSchema,BillingServicesSchema, thirdPartySoftware,
    emailSchema, handWriteRecognitionSchema, restorePicturesSchema, illiadSchema, smartphonesSchema, FTPSchema,
    ThirdPartySupportedLanguagesSchema, AbbySchema, faxSchema, networkSchema, textTranslationSchema, audioSchema
  ],
  resolvers,
  formatError: (err) => ({
    message: err.message,
    errorCode: err.extensions && err.extensions.code ? err.extensions.code : undefined
  }),
  introspection: Stage === 'dev' || Stage === 'qa',
  includeStacktraceInErrorResponses: Stage === 'dev' || Stage === 'qa',
  validationRules: [depthLimit(5)],
})

server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests()

const app = express()
app.use(cors())
app.use(cookieParser())
app.disable('x-powered-by')
app.use(
  json(),
  expressMiddleware(server, {
    // The Express request and response objects are passed into
    // your context initialization function
    context: async ({ req, res }) => {
      // Here is where you'll have access to the
      // API Gateway event and Lambda Context
      const { event, context } = serverlessExpress.getCurrentInvoke()
      context.callbackWaitsForEmptyEventLoop = false
      counter++
      const token = event.headers.authorization || event.headers.Authorization
      res.set('Strict-Transport-Security', 'max-age=31536000')
      res.set('X-XSS-Protection', '1')
      const origin = event.headers.origin ? event.headers.origin : event.headers.Origin
      const parts = origin ? origin.split('.')[0].split('/')[2] : []
      if (process.env.environment && process.env.environment === 'server') {
        if(event.headers.subdomain){
        } else if (parts[0] && parts[0] === 'www') {
          event.headers.subDomain = parts
          event.headers.subdomain = parts
        } else {
          event.headers.subDomain = parts
          event.headers.subdomain = parts
          event.headers.mainDomain = parts
        }
      } else {
        event.headers.subdomain = parts
      }
      const apiKey = event.headers.apikey || event.headers.apiKey || event.headers.ApiKey
      const requesterDomain = event.headers.subdomain
      const tier = event.headers.tier

      const operationName = req.body?.query?.includes("fragment")
        ? getFragmentOperation(req.body?.query)
        : toPascalCase(req.body?.operationName);

      logGraphQLOperation(operationName, apiKey, requesterDomain);
      
      const { error, data } = await validateToken({ token, apiKey, requesterDomain, tier })
      if (error) {
        throw new GraphQLError(error, {
          extensions: { code: '401' }
        })
      }
      context.data = data
      context.tier = tier
      return {
        operationName,
        data,
        headers: event.headers,
        requesterDomain,
        functionName: context.functionName,
        event,
        context,
        tier,
        lambdaEvent: event,
        lambdaContext: context,
        expressRequest: req,
        expressResponse: res
      }
    }
  })
)
app.use(helmet.contentSecurityPolicy());

app.use(csrf({ cookie: true }))

exports.handler = serverlessExpress({ app })