module.exports = {
    getCustomPermissions: {
        "operationName":"getCustomPermissions",
        query: `query getCustomPermissions($paginationInput: PaginationData) {
                  getCustomPermissions(paginationInput: $paginationInput) {
                    customPermission {
                      PermissionName
                      _id
                      ChildPerms {
                        PermissionName
                        Enum
                        _id
                      }
                    }
                  }
                }`,
        variables: {
            "paginationInput": {
                "pageNumber": 1,
                "limit": 100
            }
        }
    },
}
