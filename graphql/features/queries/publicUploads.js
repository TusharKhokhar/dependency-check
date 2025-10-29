module.exports = {
    getPublicUploads : {
        query: `query GetPublicUploads($paginationInput: PaginationData, $customerIds: [ID]) {
                getPublicUploads(paginationInput: $paginationInput, customerIds: $customerIds) {
                    publicUpload {
                    IsPrinted
                    IsProcessedFileName {
                        FileName
                        IsProcessed
                    }
                    Username
                    _id
                    }
                }
            }`,
        variables: {
            "paginationInput": {
            "limit": 50,
            "pattern": "Image (1).jpg",
            "pageNumber": 1
        },
        "customerIds": "6231ce19932e27000985ba60"
    },
    operationName: "GetPublicUploads"
    }
}
