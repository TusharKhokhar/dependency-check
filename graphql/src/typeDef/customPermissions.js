const typeDef = `#graphql
    type CustomPermission {
        _id: ID,
        PermissionName: String,
        ParentPermissionID: String,
        ProductType: [String],
        CustomerLevel: Boolean,
        Root: Boolean,
        IsActive: Boolean,
        IsDeleted: Boolean,
        Enum: Int
    }
    
    type ParentChildPermission {
        PermissionName: String,
        _id: ID
        ChildPerms: [CustomPermission]
    }

    input CustomPermissionInput {
        PermissionName: String,
        ParentPermissionID: String,
        ProductType: [String],
        CustomerLevel: Boolean,
        Root: Boolean,
        IsActive: Boolean,
        IsDeleted: Boolean,
        Enum: Int
    }

    type CustomPermissionResponse {
        customPermission: [ParentChildPermission],
        total: Int
    }

    extend type Query {
        getCustomPermissions(paginationInput: PaginationData): CustomPermissionResponse
        getCustomPermission(customId: ID): CustomPermission
    }
`

module.exports = typeDef
