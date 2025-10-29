module.exports = {
    addFax: {
        query: `mutation AddFax($addFaxInput: FaxInput) {
            addFax(addFaxInput: $addFaxInput) {
              FaxType
              FileName
              Pages
              SentStatus
              _id
            }
          }`,
        variables: {
            "addFaxInput": {
                "FaxType": "hp",
                "FileName": "test.pdf",
                "Pages": 1,
                "SentStatus": "sent"
              }
        }
    }
}