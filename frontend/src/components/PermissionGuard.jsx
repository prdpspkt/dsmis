import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'

/**
 * Component to guard pages based on permissions
 * Renders children only if user has required permission, otherwise redirects
 */
export function PermissionGuard({ permission, permissions, requireAll = false, fallback = 'dashboard', children }) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperuser } = usePermissions()

  useEffect(() => {
    // Skip check while loading
    if (loading) return

    // Redirect to login if not authenticated
    if (!user) {
      router.push('/login')
      return
    }

    // Superuser has access to everything
    if (isSuperuser()) return

    // Check permissions
    let hasAccess = false

    if (permission) {
      hasAccess = hasPermission(permission)
    } else if (permissions) {
      hasAccess = requireAll
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions)
    } else {
      // No permission required
      hasAccess = true
    }

    // Redirect if no access
    if (!hasAccess) {
      router.push(fallback === 'dashboard' ? '/' : fallback)
    }
  }, [user, loading, permission, permissions, requireAll, fallback, router, hasPermission, hasAnyPermission, hasAllPermissions, isSuperuser])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated
  if (!user) {
    return null
  }

  // Check access before rendering
  if (permission && !hasPermission(permission) && !isSuperuser()) {
    return null
  }

  if (permissions) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)

    if (!hasAccess && !isSuperuser()) {
      return null
    }
  }

  return <>{children}</>
}

/**
 * Component to conditionally render based on permissions
 * Unlike PermissionGuard, this doesn't redirect - just hides content
 */
export function IfPermission({ permission, permissions, requireAll = false, fallback = null, children }) {
  const { user, loading } = useAuth()
  const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperuser } = usePermissions()

  if (loading) return fallback || null
  if (!user) return fallback || null
  if (isSuperuser()) return <>{children}</>

  let hasAccess = true

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

/**
 * Component to show content only when user LACKS permission
 */
export function UnlessPermission({ permission, permissions, requireAll = false, children }) {
  const { user, loading } = useAuth()
  const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperuser } = usePermissions()

  if (loading) return null
  if (!user) return null
  if (isSuperuser()) return null

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  }

  return hasAccess ? null : <>{children}</>
}

export default PermissionGuard
