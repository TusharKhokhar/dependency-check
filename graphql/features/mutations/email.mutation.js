module.exports = {
    addEmail: {
    operationName: "AddEmail",
    query: `mutation AddEmail($addEmailInput: EmailInput!) {
        addEmail(addEmailInput: $addEmailInput) {
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
            AfterScanning
            AfterSelectingMedia
            BeforeSending
            }
            IsActive
            Login
            IsDeleted
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
            CreatedBy
        }
    }`,
    variables: {
        addEmailInput: {
            CustomerID: "640f3002990d30e56686bd77",
            Tags: [
                "test"
            ],
            SenderName: "Testuser",
            SenderEmail: "test@example.com",
            SMTP: "smtp.example.com",
            Port: "587",
            Username: "testuser",
            DefaultSubject: "Test Subject",
            DefaultCC: "testcc@example.com",
            DefaultAddress: "test@example.com",
            SSLType: "TLS",
            Password: "",
            MessageBody: "This is a test email.",
            EmailConnection: {
                AfterSelectingMedia: "test",
                AfterScanning: "test",
                BeforeSending: "test"
            },
            EmailAuthentication: {
                Gmail: true,
                Microsoft: false,
                Facebook: false
            },
            IsActive: true,
            Login: "testlogin",
        }
    }
},
    updateEmail: {
        operationName: "UpdateEmail",
        query: `mutation UpdateEmail($customerId: ID!, $updateEmailInput: EmailInput) {
                  updateEmail(customerId: $customerId, updateEmailInput: $updateEmailInput) {
                    message
                    statusCode
                  }
                }`,
        variables: {
            updateEmailInput: {
                CustomerID: "640f3002990d30e56686bd77",
                MessageBody: "New updated",
            },
            customerId: "640f3002990d30e56686bd77"
        }
    },
    emailDeleted: {
        operationName: "EmailDeleted",
        query: `mutation EmailDeleted($customerId: ID!, $isDeleted: Boolean) {
                emailDeleted(customerId: $customerId, IsDeleted: $isDeleted) {
                    message
                    statusCode
                }
                }`,
        variables: {
            customerId: "640f3002990d30e56686bd77",
            IsDeleted: true
        }
    },
    emailStatus: {
        operationName: "EmailStatus",
        query: `mutation EmailStatus($isActive: Boolean, $customerId: ID!) {
                emailStatus(IsActive: $isActive, customerId: $customerId) {
                    message
                    statusCode
                }
                }`,
        variables: {
            customerId: "640f3002990d30e56686bd77",
            IsActive: false
        }
    },

}
