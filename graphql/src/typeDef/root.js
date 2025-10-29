const typeDef = `#graphql
    type Response {
        message: String,
        statusCode: Int
    }
    
    type Query {
    _empty: String
    }
    type Mutation {
    _empty: String
    }
`

module.exports = typeDef
