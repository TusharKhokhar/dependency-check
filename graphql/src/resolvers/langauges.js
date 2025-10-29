const dot = require('dot-object')
dot.keepArray = true
const { SupportedLanguages } = require('../../models/collections')
const {getDatabase, verifyUserAccess} = require("../../helpers/util");
const CustomLogger = require("../../helpers/customLogger");
const log = new CustomLogger()

module.exports = {
    Query: {
        async getLanguages (_, { }, context) {
            log.lambdaSetup(context, 'languages', 'getLanguages')
            if (context.data?.CustomerID) {
                verifyUserAccess(context, context.data.CustomerID);
            }
            const db = await getDatabase(context)
            const collection = db.collection(SupportedLanguages)
            return await collection.find({}).toArray()
        },
    }
}
