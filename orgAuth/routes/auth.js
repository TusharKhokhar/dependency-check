const Express = require('express')
const { redirectLogin, loginHandler, redirectCallback, samlCallbackHandler } = require("../controllers/common.controller");
const { metaData } = require("../controllers/saml.controller");
const Router = Express.Router()

/**
 * auth management APIs
 */

Router.get('/saml/metadata', metaData)

Router.get('/login', redirectLogin)

Router.post('/login', loginHandler)

Router.get('/callback', redirectCallback)

Router.post('/callback', samlCallbackHandler)

Router.get('/gsuite/callback', redirectCallback) // for testing only

module.exports = Router
