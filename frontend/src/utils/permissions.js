// Permission mapping for menu items and pages
export const PERMISSION_MAP = {
  // Dashboard
  'dashboard': 'dashboard.view',

  // Student Management
  'students': 'students.view',
  'students/new': 'students.admission',

  // Operations
  'tokens': 'tokens.view',
  'guest-billing': 'guest_billing.view',
  'tmo-billing': 'tmo_billing.view',

  // Packages
  'packages': 'packages.view',

  // Financial
  'invoices': 'invoices.view',
  'accounting': 'accounting.view',
  'assets': 'assets.view',
  'accounting/shareholders': 'shareholders.view',
  'accounting/shareholders-equity': 'shareholders.view',
  'accounting/fiscal-years': 'accounting.manage_fiscal_years',

  // Reports
  'reports': 'reports.view',

  // User Management
  'management/users': 'users.view',
  'management/roles': 'roles.view',
}

// Map of permissions required for specific actions
export const ACTION_PERMISSIONS = {
  // Students
  'create_student': 'students.manage',
  'edit_student': 'students.manage',
  'delete_student': 'students.manage',

  // Tokens
  'create_token': 'tokens.manage',
  'edit_token': 'tokens.manage',
  'delete_token': 'tokens.manage',

  // Guest Billing
  'create_guest_bill': 'guest_billing.manage',
  'edit_guest_bill': 'guest_billing.manage',
  'delete_guest_bill': 'guest_billing.manage',

  // TMO Billing
  'create_tmo': 'tmo_billing.manage',
  'edit_tmo': 'tmo_billing.manage',
  'delete_tmo': 'tmo_billing.manage',

  // Packages
  'create_package': 'packages.manage',
  'edit_package': 'packages.manage',
  'delete_package': 'packages.manage',

  // Invoices
  'create_invoice': 'invoices.create',
  'edit_invoice': 'invoices.manage',
  'delete_invoice': 'invoices.manage',

  // Accounting
  'create_journal_entry': 'accounting.create_journal',
  'manage_accounts': 'accounting.manage_accounts',
  'close_fiscal_year': 'accounting.manage_fiscal_years',

  // Assets
  'create_asset': 'assets.manage',
  'edit_asset': 'assets.manage',
  'delete_asset': 'assets.manage',

  // Shareholders
  'create_shareholder': 'shareholders.manage',
  'edit_shareholder': 'shareholders.manage',
  'delete_shareholder': 'shareholders.manage',

  // Users
  'create_user': 'users.create',
  'edit_user': 'users.manage',
  'delete_user': 'users.delete',
  'reset_user_password': 'users.reset_password',

  // Roles
  'create_role': 'roles.manage',
  'edit_role': 'roles.manage',
  'delete_role': 'roles.manage',
}

/**
 * Check if user has a specific permission
 * @param {Object} user - User object with all_permissions array
 * @param {String} permission - Permission name to check
 * @returns {Boolean}
 */
export const hasPermission = (user, permission) => {
  if (!user) return false
  if (user.isSuperuser || user.is_superuser) return true
  return user?.all_permissions?.includes(permission) || false
}

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object
 * @param {Array} permissions - Array of permission names
 * @returns {Boolean}
 */
export const hasAnyPermission = (user, permissions) => {
  if (!user) return false
  if (user.isSuperuser || user.is_superuser) return true
  return permissions.some(perm => user?.all_permissions?.includes(perm))
}

/**
 * Check if user has all of the specified permissions
 * @param {Object} user - User object
 * @param {Array} permissions - Array of permission names
 * @returns {Boolean}
 */
export const hasAllPermissions = (user, permissions) => {
  if (!user) return false
  if (user.isSuperuser || user.is_superuser) return true
  return permissions.every(perm => user?.all_permissions?.includes(perm))
}

/**
 * Get permission required for a specific path
 * @param {String} path - Route path
 * @returns {String|null} - Permission name or null
 */
export const getPermissionForPath = (path) => {
  // Remove leading slash and query params
  const cleanPath = path.replace(/^\//, '').split('?')[0]
  return PERMISSION_MAP[cleanPath] || null
}

/**
 * Check if user can access a specific path
 * @param {Object} user - User object
 * @param {String} path - Route path
 * @returns {Boolean}
 */
export const canAccessPath = (user, path) => {
  const permission = getPermissionForPath(path)
  if (!permission) return true // No permission required
  return hasPermission(user, permission)
}

/**
 * Filter menu items based on user permissions
 * @param {Array} items - Menu items with path property
 * @param {Object} user - User object
 * @returns {Array} - Filtered menu items
 */
export const filterMenuByPermissions = (items, user) => {
  return items.filter(item => {
    if (!item.path) return true // Keep parent items
    return canAccessPath(user, item.path)
  })
}

/**
 * Get permission display name from permission code
 * @param {String} permissionCode - Permission code
 * @returns {String} - Display name
 */
export const getPermissionDisplayName = (permissionCode) => {
  return permissionCode
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
