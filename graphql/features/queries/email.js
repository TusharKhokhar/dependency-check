module.exports = {
  getEmail: {
    operationName: "GetEmail",
    query: `query GetEmail($customerId: ID) {
            getEmail(customerId: $customerId) {
              CreatedBy
              CustomerID
              DefaultAddress
              DefaultCC
              DefaultSubject
              EmailAuthentication {
                Facebook
                Gmail
                Microsoft
              }
              EmailConnection {
                BeforeSending
                AfterSelectingMedia
                AfterScanning
              }
              IsActive
              IsDeleted
              Login
              MessageBody
              Password
              Port
              SMTP
              SSLType
              SenderEmail
              SenderName
              Tags
              Username
              _id
            }
          }`,
    variables: {
      customerId: "640f3002990d30e56686bd77",
    },
  },
};
