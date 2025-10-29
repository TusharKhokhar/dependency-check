const dot = require('dot-object')
dot.keepArray = true
const { PaperSizes } = require('../../models/collections')
const {getDb} = require("../../config/dbHandler");
const CustomLogger = require("../../helpers/customLogger");
const { verifyUserAccess } = require('../../helpers/util');
const log = new CustomLogger()

module.exports = {
    Query: {
        async getPaperSizes (_, { }, context) {
            log.lambdaSetup(context, 'paperSizes', 'getPaperSizes')
            if (context.data?.CustomerID) {
                verifyUserAccess(context, context.data.CustomerID);
            }
            const db = await getDb()
            const collection = db.collection(PaperSizes)
            const paperSizes =  await db.collection('PaperSizes').find({}).toArray()
            log.info('paperSizes********',paperSizes);
            return paperSizes
        },
    }
}
