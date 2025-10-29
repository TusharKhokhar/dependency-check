const typeDef = `#graphql
    type Permission {
        _id: ID,
        PermissionName: String,
        RootLevel: Boolean,
        CustomerLevel: Boolean,
        ProductLevel: String,
        PermissionCategoryId: String,
        ParentPermission: Boolean,
        PermissionMenuID: String,
        InnerParent: Boolean,
        Order: Int,
        CreatedAt: Date,
        CreatedBy: String,
        UpdatedBy: String,
        IsDeleted: Boolean
    }
 
    input PermissionInput {
        PermissionName: String,
        RootLevel: Boolean,
        CustomerLevel: Boolean,
        ProductLevel: String,
        PermissionCategoryId: String,
        PermissionMenuID: String,
        InnerParent: Boolean,
        ParentPermission: Boolean,
        Order: Int,
        CreatedAt: Date,
        CreatedBy: String,
        UpdatedBy: String,
        IsDeleted: Boolean,
        Add: Boolean
        List: Boolean
    }
    
    type PermissionSchema {
        _id: ID,
        PermissionName: String,
        RootLevel: Boolean,
        CustomerLevel: Boolean,
        ProductLevel: String,
        PermissionCategoryId: String,
        ParentPermission: Boolean,
        PermissionMenuID: String,
        InnerParent: Boolean,
        child: [ChildPermissionSchema]
    }
    
    type ChildPermissionSchema {
        _id: ID
        PermissionName: String,
        RootLevel: Boolean,
        CustomerLevel: Boolean,
        ProductLevel: String,
        PermissionCategoryId: String,
        ParentPermission: Boolean,
        PermissionMenuID: String,
        InnerParent: Boolean,
        Add: Boolean
        childPermissions: [Permission]
        List: Boolean
    }
 
     extend type Mutation {
         addPermission(addPermissionInput: PermissionInput): Permission
     }

     extend type Query {
        getCustomerLevelPermission: [Permission]
        getRootLevelPermission : [Permission]
        getParentPermission : [Permission]
        getChildPermission(permissionID: String) : [Permission]
        getParentChildPermission : [PermissionSchema]
     }
`

module.exports = typeDef
