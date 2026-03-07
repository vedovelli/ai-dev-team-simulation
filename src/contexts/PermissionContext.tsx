/**
 * Permission Context for managing user roles and permissions
 *
 * Provides role-based and feature-based permission checks throughout the app
 * Caches permission results to avoid redundant API calls
 */

import React, { createContext, useCallback, useMemo, useState, useEffect } from 'react'

export type UserRole = 'admin' | 'developer' | 'viewer'

export interface PermissionResult {
  hasPermission: boolean
  isLoading: boolean
  error?: string
}

export interface PermissionContextType {
  userRole: UserRole | null
  isLoading: boolean
  error?: string
  checkPermission: (feature: string) => Promise<boolean>
  hasPermission: (feature: string) => PermissionResult
  permissionCache: Map<string, boolean>
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

/**
 * Permission Provider Component
 * Wraps the app to provide permission checking capabilities
 */
export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [permissionCache] = useState(new Map<string, boolean>())

  // Fetch user role on mount
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/auth/user-role')
        if (!response.ok) {
          throw new Error('Failed to fetch user role')
        }
        const data = await response.json()
        setUserRole(data.role)
        setError(undefined)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        // Default to viewer role on error for safety
        setUserRole('viewer')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserRole()
  }, [])

  /**
   * Check a single permission via API call
   * Results are cached to avoid redundant requests
   */
  const checkPermission = useCallback(
    async (feature: string): Promise<boolean> => {
      // Return cached result if available
      if (permissionCache.has(feature)) {
        return permissionCache.get(feature) || false
      }

      try {
        const response = await fetch('/api/permissions/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feature, role: userRole }),
        })

        if (!response.ok) {
          throw new Error('Failed to check permission')
        }

        const data = await response.json()
        const hasPermission = data.hasPermission || false

        // Cache the result
        permissionCache.set(feature, hasPermission)

        return hasPermission
      } catch (err) {
        console.error(`Error checking permission for ${feature}:`, err)
        return false
      }
    },
    [userRole, permissionCache]
  )

  /**
   * Synchronous permission check with loading state
   * Uses cached results if available
   */
  const hasPermission = useCallback(
    (feature: string): PermissionResult => {
      // If we're still loading the user role, we don't know permissions yet
      if (isLoading) {
        return {
          hasPermission: false,
          isLoading: true,
        }
      }

      // If user role failed to load, deny access
      if (!userRole) {
        return {
          hasPermission: false,
          isLoading: false,
          error: error || 'User role not loaded',
        }
      }

      // Check cache first
      if (permissionCache.has(feature)) {
        const cached = permissionCache.get(feature) || false
        return {
          hasPermission: cached,
          isLoading: false,
        }
      }

      // If not cached, trigger async check
      checkPermission(feature).catch(err => {
        console.error(`Error checking permission for ${feature}:`, err)
      })

      // Return optimistic false while loading
      return {
        hasPermission: false,
        isLoading: true,
      }
    },
    [isLoading, userRole, error, permissionCache, checkPermission]
  )

  const value = useMemo<PermissionContextType>(
    () => ({
      userRole,
      isLoading,
      error,
      checkPermission,
      hasPermission,
      permissionCache,
    }),
    [userRole, isLoading, error, checkPermission, hasPermission, permissionCache]
  )

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

/**
 * Hook to access permission checking functionality
 * Must be used inside a PermissionProvider
 */
export function usePermission() {
  const context = React.useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider')
  }
  return context
}
