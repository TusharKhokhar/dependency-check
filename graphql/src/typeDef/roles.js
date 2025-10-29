const typeDef = `#graphql
    type Role {
        _id: ID,
        CustomerID: ID,
        Permissions: [ID],
        CustomPermissions: [ID],
        Root: Boolean,
        RoleName: String,
        IsDeleted: Boolean,
        IsActive: Boolean,
        CustomerData: CustomerDataSchema,
        NavigationPermissionID: ID
    }

    input RoleInput {
        CustomerID: ID,
        Permissions: [ID],
        CustomPermissions: [ID],
        Root: Boolean,
        RoleName: String,
        IsDeleted: Boolean,
        IsActive: Boolean
        NavigationPermissionID: ID
    }

    type RolesResponse {
        role: [Role],
        total: Int
    }

    extend type Mutation {
        addRole(addRoleInput: RoleInput): Role
        updateRole(updateRoleInput: RoleInput, roleId: ID!): Response
        roleDeleted(IsDeleted: Boolean, roleId: ID, customerId: ID): Response
        roleStatus(IsActive: Boolean, roleId: ID, customerId: ID): Response
    }

    extend type Query {
        getRoles(paginationInput: PaginationData, customerIds: [ID], locationIds: [ID]): RolesResponse
        getRole(roleId: ID, customerId: ID): Role
    }
`

module.exports = typeDef
