import { gql } from '@apollo/client'

// =============================================================================
// Permission Queries
// =============================================================================

export const GET_ALL_PERMISSIONS = gql`
  query GetAllPermissions {
    allPermissions {
      id
      name
      display_name
      description
      category
      createdAt
    }
  }
`

export const GET_PERMISSIONS_BY_CATEGORY = gql`
  query GetPermissionsByCategory($category: String!) {
    permissionsByCategory(category: $category) {
      id
      name
      display_name
      description
      category
    }
  }
`

// =============================================================================
// Custom Role Queries
// =============================================================================

export const GET_ALL_CUSTOM_ROLES = gql`
  query GetAllCustomRoles {
    allCustomRoles {
      id
      name
      description
      isActive
      permissionCount
      createdAt
      updatedAt
      createdBy {
        id
        username
      }
      permissions {
        id
        name
        display_name
        category
      }
    }
  }
`

export const GET_ACTIVE_CUSTOM_ROLES = gql`
  query GetActiveCustomRoles {
    activeCustomRoles {
      id
      name
      description
      permissionCount
    }
  }
`

export const GET_CUSTOM_ROLE_BY_ID = gql`
  query GetCustomRoleById($id: ID!) {
    customRoleById(id: $id) {
      id
      name
      description
      isActive
      createdAt
      updatedAt
      createdBy {
        id
        username
      }
      permissions {
        id
        name
        display_name
        description
        category
      }
    }
  }
`

// =============================================================================
// User Queries
// =============================================================================

export const GET_ALL_USERS = gql`
  query GetAllUsers {
    allUsers {
      id
      username
      email
      firstName
      lastName
      phone
      address
      isStaff
      isActive
      isSuperuser
      customRoleName
      permissionCount
      allPermissions
      createdAt
      updatedAt
      createdBy {
        id
        username
      }
      customRole {
        id
        name
      }
      additionalPermissions {
        id
        name
        display_name
        category
      }
    }
  }
`

export const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    userById(id: $id) {
      id
      username
      email
      firstName
      lastName
      phone
      address
      isStaff
      isActive
      isSuperuser
      customRoleName
      allPermissions
      createdAt
      updatedAt
      createdBy {
        id
        username
      }
      customRole {
        id
        name
        description
        permissions {
          id
          name
          display_name
          category
        }
      }
      additionalPermissions {
        id
        name
        display_name
        category
      }
    }
  }
`

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    currentUser {
      id
      username
      email
      firstName
      lastName
      isSuperuser
      isStaff
      customRoleName
      allPermissions
    }
  }
`

export const GET_USERS_BY_ROLE = gql`
  query GetUsersByRole($roleId: ID!) {
    usersByRole(roleId: $roleId) {
      id
      username
      email
      firstName
      lastName
      isActive
      customRoleName
    }
  }
`

// =============================================================================
// Permission Mutations
// =============================================================================

export const CREATE_PERMISSION = gql`
  mutation CreatePermission(
    $name: String!
    $displayName: String!
    $description: String
    $category: String!
  ) {
    createPermission(
      name: $name
      displayName: $displayName
      description: $description
      category: $category
    ) {
      permission {
        id
        name
        display_name
        description
        category
      }
    }
  }
`

export const UPDATE_PERMISSION = gql`
  mutation UpdatePermission(
    $id: ID!
    $displayName: String
    $description: String
    $category: String
  ) {
    updatePermission(
      id: $id
      displayName: $displayName
      description: $description
      category: $category
    ) {
      permission {
        id
        name
        display_name
        description
        category
      }
    }
  }
`

export const DELETE_PERMISSION = gql`
  mutation DeletePermission($id: ID!) {
    deletePermission(id: $id) {
      success
    }
  }
`

// =============================================================================
// Custom Role Mutations
// =============================================================================

export const CREATE_CUSTOM_ROLE = gql`
  mutation CreateCustomRole(
    $name: String!
    $description: String
    $permissionIds: [ID]
  ) {
    createCustomRole(
      name: $name
      description: $description
      permissionIds: $permissionIds
    ) {
      customRole {
        id
        name
        description
        isActive
        permissionCount
        createdAt
        permissions {
          id
          name
          display_name
          category
        }
      }
    }
  }
`

export const UPDATE_CUSTOM_ROLE = gql`
  mutation UpdateCustomRole(
    $id: ID!
    $name: String
    $description: String
    $permissionIds: [ID]
    $isActive: Boolean
  ) {
    updateCustomRole(
      id: $id
      name: $name
      description: $description
      permissionIds: $permissionIds
      isActive: $isActive
    ) {
      customRole {
        id
        name
        description
        isActive
        permissionCount
        permissions {
          id
          name
          display_name
          category
        }
      }
    }
  }
`

export const DELETE_CUSTOM_ROLE = gql`
  mutation DeleteCustomRole($id: ID!) {
    deleteCustomRole(id: $id) {
      success
    }
  }
`

// =============================================================================
// User Mutations
// =============================================================================

export const CREATE_USER = gql`
  mutation CreateUser(
    $username: String!
    $email: String
    $firstName: String
    $lastName: String
    $password: String!
    $phone: String
    $address: String
    $customRoleId: ID
    $additionalPermissionIds: [ID]
    $isStaff: Boolean
    $isActive: Boolean
  ) {
    createUser(
      username: $username
      email: $email
      firstName: $firstName
      lastName: $lastName
      password: $password
      phone: $phone
      address: $address
      customRoleId: $customRoleId
      additionalPermissionIds: $additionalPermissionIds
      isStaff: $isStaff
      isActive: $isActive
    ) {
      user {
        id
        username
        email
        firstName
        lastName
        phone
        isStaff
        isActive
        customRoleName
        allPermissions
        createdBy {
          id
          username
        }
      }
    }
  }
`

export const UPDATE_USER = gql`
  mutation UpdateUser(
    $id: ID!
    $email: String
    $firstName: String
    $lastName: String
    $phone: String
    $address: String
    $customRoleId: ID
    $additionalPermissionIds: [ID]
    $isStaff: Boolean
    $isActive: Boolean
  ) {
    updateUser(
      id: $id
      email: $email
      firstName: $firstName
      lastName: $lastName
      phone: $phone
      address: $address
      customRoleId: $customRoleId
      additionalPermissionIds: $additionalPermissionIds
      isStaff: $isStaff
      isActive: $isActive
    ) {
      user {
        id
        username
        email
        firstName
        lastName
        phone
        isStaff
        isActive
        customRoleName
        allPermissions
        customRole {
          id
          name
        }
        additionalPermissions {
          id
          name
          display_name
        }
      }
    }
  }
`

export const SET_USER_PASSWORD = gql`
  mutation SetUserPassword($id: ID!, $password: String!) {
    setUserPassword(id: $id, password: $password) {
      success
    }
  }
`

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      success
    }
  }
`
