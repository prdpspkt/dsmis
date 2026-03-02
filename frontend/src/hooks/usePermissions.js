import { useAuth } from '../contexts/AuthContext'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessPath
} from '../utils/permissions'

/**
 * Custom hook for checking permissions
 * @returns {Object} - Permission utility functions
 */
export const usePermissions = () => {
  const { user } = useAuth()

  // Helper to check if user is superuser (handles both camelCase and snake_case)
  const isSuperuser = () => user?.isSuperuser || user?.is_superuser || false

  return {
    /**
     * Check if user has a specific permission
     * @param {String} permission - Permission name
     * @returns {Boolean}
     */
    hasPermission: (permission) => hasPermission(user, permission),

    /**
     * Check if user has any of the specified permissions
     * @param {Array} permissions - Array of permission names
     * @returns {Boolean}
     */
    hasAnyPermission: (permissions) => hasAnyPermission(user, permissions),

    /**
     * Check if user has all of the specified permissions
     * @param {Array} permissions - Array of permission names
     * @returns {Boolean}
     */
    hasAllPermissions: (permissions) => hasAllPermissions(user, permissions),

    /**
     * Check if user can access a specific path
     * @param {String} path - Route path
     * @returns {Boolean}
     */
    canAccessPath: (path) => canAccessPath(user, path),

    /**
     * Check if user is superuser
     * @returns {Boolean}
     */
    isSuperuser: isSuperuser,

    /**
     * Get all permissions
     * @returns {Array}
     */
    getAllPermissions: () => user?.all_permissions || [],

    /**
     * Get user role
     * @returns {String}
     */
    getRole: () => user?.customRoleName || user?.role || null,
  }
}
