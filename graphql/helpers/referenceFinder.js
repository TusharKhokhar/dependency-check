const { relationMapping } = require('./relationMapping')
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')

module.exports.findReference = async (item, id, db) => {
    const references = relationMapping[item]
    const errorSet = []
    for (const ref of references) {
        if (ref.required) {
            const resp = await db.collection(ref.collectionName).findOne({ [ref.reference]: ObjectId.createFromHexString(id), IsDeleted: false })
            if (resp) {
                errorSet.push(ref.collectionName)
            }
        }
    }
    return errorSet
}