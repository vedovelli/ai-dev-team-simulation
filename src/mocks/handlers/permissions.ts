/**
 * MSW Handlers for Permission & Role-Based Access Control
 *
 * Mock API endpoints for permission checking and user role management
 * Supports different permission sets per role (admin, developer, viewer)
 * Includes delayed responses to test loading states
 */

import { http, HttpResponse, delay } from 'msw'
import type { UserRole } from '../../contexts/PermissionContext'

/**
 * Define role-based permissions
 * Each role has a set of allowed features
 */
const rolePermissions: Record<UserRole, Set<string>> = {
  admin: new Set([
    'view-dashboard',
    'edit-dashboard',
    'manage-users',
    'manage-roles',
    'view-analytics',
    'edit-analytics',
    'manage-settings',
    'view-protected-dashboard',
  ]),
  developer: new Set([
    'view-dashboard',
    'view-analytics',
    'view-protected-dashboard',
    'create-tasks',
    'edit-own-tasks',
    'view-code-reviews',
  ]),
  viewer: new Set([
    'view-dashboard',
    'view-analytics',
  ]),
}

/**
 * In-memory store for user roles
 * In production, this would be fetched from a session or token
 */
const userRoles = new Map<string, UserRole>([
  ['default', 'developer'], // Default user role
])

/**
 * Get the current user's role
 */
function getUserRole(): UserRole {
  // In a real app, this would come from session/JWT
  // For this demo, we default to developer
  return userRoles.get('default') || 'developer'
}

/**
 * Check if a user has permission for a feature
 */
function checkFeaturePermission(feature: string, role: UserRole): boolean {
  const permissions = rolePermissions[role]
  return permissions ? permissions.has(feature) : false
}

export const permissionHandlers = [
  /**
   * GET /api/auth/user-role
   * Fetch the current user's role
   */
  http.get('/api/auth/user-role', async () => {
    await delay(500) // Simulate network latency

    const role = getUserRole()

    return HttpResponse.json(
      { role },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }),

  /**
   * POST /api/permissions/check
   * Check if a user has permission for a specific feature
   * Request body: { feature: string, role?: UserRole }
   * Response: { hasPermission: boolean }
   */
  http.post('/api/permissions/check', async ({ request }) => {
    await delay(300) // Simulate network latency and permission check

    try {
      const body = await request.json() as { feature: string; role?: UserRole }
      const { feature, role: requestedRole } = body

      // Use requested role or fetch current user's role
      const role = requestedRole || getUserRole()

      // Validate inputs
      if (!feature || typeof feature !== 'string') {
        return HttpResponse.json(
          { error: 'Invalid feature parameter' },
          { status: 400 }
        )
      }

      const hasPermission = checkFeaturePermission(feature, role)

      return HttpResponse.json(
        {
          feature,
          role,
          hasPermission,
        },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    } catch (error) {
      console.error('Permission check error:', error)
      return HttpResponse.json(
        { error: 'Failed to check permission' },
        { status: 500 }
      )
    }
  }),

  /**
   * GET /api/permissions/me
   * Get all permissions for the current user
   * Response: { role: string, permissions: string[] }
   */
  http.get('/api/permissions/me', async () => {
    await delay(500) // Simulate network latency

    const role = getUserRole()
    const permissions = Array.from(rolePermissions[role] || new Set())

    return HttpResponse.json(
      {
        role,
        permissions,
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }),

  /**
   * GET /api/roles
   * Get all available roles and their permissions
   * Response: { roles: { name: string, permissions: string[] }[] }
   */
  http.get('/api/roles', async () => {
    await delay(400) // Simulate network latency

    const roles = Object.entries(rolePermissions).map(([name, permissions]) => ({
      name,
      permissions: Array.from(permissions),
    }))

    return HttpResponse.json(
      { roles },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }),
]
