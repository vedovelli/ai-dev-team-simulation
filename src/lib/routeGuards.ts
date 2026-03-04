/**
 * Route guards for protecting routes and implementing conditional navigation
 * Useful for authentication checks, authorization, and feature flags
 */

/**
 * Guard type for route access control
 */
export interface RouteGuardContext {
  authenticated?: boolean
  role?: string
  permissions?: string[]
}

/**
 * Creates a guard that checks if user is authenticated
 */
export function createAuthGuard(context: RouteGuardContext) {
  return () => {
    if (!context.authenticated) {
      throw new Error('Authentication required')
    }
  }
}

/**
 * Creates a guard that checks user role
 */
export function createRoleGuard(context: RouteGuardContext, requiredRole: string) {
  return () => {
    if (!context.authenticated) {
      throw new Error('Authentication required')
    }
    if (context.role !== requiredRole) {
      throw new Error(`Role "${requiredRole}" required`)
    }
  }
}

/**
 * Creates a guard that checks permissions
 */
export function createPermissionGuard(context: RouteGuardContext, requiredPermissions: string[]) {
  return () => {
    if (!context.authenticated) {
      throw new Error('Authentication required')
    }
    const userPermissions = context.permissions || []
    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    )
    if (!hasAllPermissions) {
      throw new Error('Insufficient permissions')
    }
  }
}

/**
 * Creates a combined guard checking multiple conditions
 */
export function createCombinedGuard(
  context: RouteGuardContext,
  checks: Array<() => void>
) {
  return () => {
    checks.forEach((check) => check())
  }
}

/**
 * Validates route params
 */
export function validateRouteParams<T>(
  params: unknown,
  schema: { parse: (data: unknown) => T }
): T {
  try {
    return schema.parse(params)
  } catch (error) {
    throw new Error(`Invalid route parameters: ${error instanceof Error ? error.message : String(error)}`)
  }
}
