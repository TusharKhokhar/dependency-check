const {getDb} = require('../publicAuth/config/db')
const collectionName = 'TranslationUploads'


module.exports = {
    addTranslationUpload: async () => {
        const db = await getDb()
        const {insertedId} = await db.collection(collectionName).insertOne(
            {
                "IsProcessedFileName" : [
                    {
                        "FileName" : "ed971bc8-a225-44b1-8124-40706a85d693.pdf",
                        "IsProcessed" : false
                    }
                ]
            }
        )
        return insertedId
    }
}