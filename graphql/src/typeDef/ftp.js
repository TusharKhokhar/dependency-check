const typeDef = `#graphql

    enum FTPType {
       FTP
       SFTP
       FTPS
    }

    type FTP {
        _id: ID,
        CustomerID: ID,
        CustomerName: String,
        ThirdPartySoftwareName: String,
        ThirdPartySoftwareType: ThirdPartySoftwareType!,
        Tags: [String],
        FTPType: FTPType,
        HostName: String,
        PortNumber: Int,
        Username: String,
        Password: String,
        IsActive: Boolean,
        CreatedBy: String,
        IsDeleted: Boolean,
    }

    input FTPInput {
        CustomerID: ID!,
        ThirdPartySoftwareName: String!,
        ThirdPartySoftwareType: ThirdPartySoftwareType!,
        Tags: [String],
        FTPType: FTPType!,
        HostName: String,
        PortNumber: Int,
        Username: String,
        Password: String,
        IsActive: Boolean,
    }

    extend type Mutation {
        addFTP(addFTPInput: FTPInput): FTP
        updateFTP(updateFTPInput: FTPInput, customerId: ID!): Response
        deleteFTP(IsDeleted: Boolean, customerId: ID!): Response
        updateFTPStatus(IsActive: Boolean, customerId: ID!): Response
    }

    extend type Query {
        getFTP(customerId: ID!): FTP
    }
`;

module.exports = typeDef;
