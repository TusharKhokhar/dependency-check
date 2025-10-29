const typeDef = `#graphql

extend type Mutation {
    ippJobStatus(customerId: ID, releaseCode: String, status: String, message: String): Response
}`

module.exports = typeDef
