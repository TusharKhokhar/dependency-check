const Express = require('express')
const { getPrintJobs, sendPrintJobs, deleteJobs, validateUser } = require('../controllers/partner.controller')
const { sendPrintJobsValidate } = require('../validators')
const { deleteValidate, userValidate} = require('../validators/partner.validator')
const {bulkUserImport, enableDisableUsers, bulkDeleteUsers, updateUserByUserName} = require("../controllers/auth.controller");
const {userImportSignUp, deleteUsers, enableDisable, updateGroups} = require("../validators/user.validator");
const Router = Express.Router()

/**
 * Partner management APIs
 */

Router.get('/jobs', getPrintJobs)
Router.post('/send', sendPrintJobsValidate, sendPrintJobs)
Router.delete('/job', deleteValidate, deleteJobs)
Router.post('/validateUser', userValidate, validateUser)

// Users API

Router.post('/users/import', userImportSignUp, bulkUserImport)
Router.delete('/users', deleteUsers, bulkDeleteUsers)
Router.put('/users/status', enableDisable, enableDisableUsers)
Router.put('/users/groups', updateGroups, updateUserByUserName)

module.exports = Router
