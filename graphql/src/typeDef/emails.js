const typeDef = `#graphql

type Email {
    _id: ID,
    CustomerID: ID,
    CustomerName: String,
    ThirdPartySoftwareName: String,
    ThirdPartySoftwareType: ThirdPartySoftwareType
    Tags: [String],
    SenderName: String,
    SenderEmail: String,
    SMTP: String,
    Port: Int,
    Username: String,
    DefaultSubject: String,
    DefaultCC: String,
    DefaultAddress: String,
    SSLType: Boolean,
    Login: String,
    Password: String,
    MessageBody: String,
    EmailConnection: EmailConnectionType,
    EmailAuthenticationEnabled: Boolean,
    EmailAuthentication: EmailAuthenticationType,
    IsActive: Boolean,
    CreatedBy: String,
    IsDeleted: Boolean
}

input EmailInput {
    CustomerID: ID,
    CustomerName: String,
    ThirdPartySoftwareName: String!,
    ThirdPartySoftwareType: ThirdPartySoftwareType!,
    Tags: [String],
    SenderName: String,
    SenderEmail: String,
    SMTP: String,
    Port: Int,
    Username: String,
    DefaultSubject: String,
    DefaultCC: String,
    DefaultAddress: String,
    SSLType: Boolean,
    Login: String,
    Password: String,
    MessageBody: String,
    EmailConnection: EmailConnectionInput,
    EmailAuthenticationEnabled: Boolean,
    EmailAuthentication: EmailAuthenticationInput,
    IsActive: Boolean
}

type EmailConnectionType {
    AfterSelectingMedia: Boolean,
    AfterScanning: Boolean,
    BeforeSending: Boolean
}

input EmailConnectionInput {
    AfterSelectingMedia: Boolean,
    AfterScanning: Boolean,
    BeforeSending: Boolean
}

type EmailAuthenticationType {
    EmailAuthenticationTitle: String,
    Gmail: Boolean,
    GmailDisplayText: String,
    Microsoft: Boolean,
    MicrosoftDisplayText: String,
    Facebook: Boolean,
    FacebookDisplayText: String
}

input EmailAuthenticationInput {
    EmailAuthenticationTitle: String,
    Gmail: Boolean,
    GmailDisplayText: String,
    Microsoft: Boolean,
    MicrosoftDisplayText: String,
    Facebook: Boolean,
    FacebookDisplayText: String
}

extend type Mutation {
    addEmail(addEmailInput: EmailInput): Email
    updateEmail(updateEmailInput: EmailInput, customerId: ID!): Response
    emailDeleted(IsDeleted: Boolean, customerId: ID!): Response
    emailStatus(IsActive: Boolean, customerId: ID!): Response
}

extend type Query {
    getEmail(customerId: ID): Email
}
`
module.exports = typeDef
