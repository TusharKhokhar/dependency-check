const typeDef = `#graphql

type PaperSizes {
    _id: ID,
    PaperName: String,
    Width: Int,
    Height: Int,
    Value: Int
}

extend type Query {
    getPaperSizes: [PaperSizes]
}
`

module.exports = typeDef
