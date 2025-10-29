const { inputMapping } = require('./inputMapping')
const {GraphQLError} = require("graphql");
const {REQUIRED_FIELDS_MISSING} = require("./error-messages");

module.exports.validateInputBody = async (inputType, item) => {
    const references = inputMapping[inputType]
    const errorSet = []
    for (const ref of references) {
        if((!item[ref] || item[ref] === '') || (Array.isArray(item[ref]) && item[ref].length === 0) ) {
            errorSet.push(ref)
        }
    }
    if (errorSet.length > 0) {
        const newErrorSet = errorSet.join(', ')
        throw new GraphQLError(`${REQUIRED_FIELDS_MISSING}${newErrorSet}`, {
            extensions: {
                code: '400'
            }
        })
    }
    return errorSet
}