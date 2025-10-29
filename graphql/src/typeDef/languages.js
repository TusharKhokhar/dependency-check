const typeDef = `#graphql

type Language {
    _id: ID,
    language: String,
    locale: String,
    flagLang: String,
    currency: String,
    date: String,
    currencySymbol: String,
    Separator: String,
}

extend type Query {
    getLanguages: [Language]
}
`

module.exports = typeDef
