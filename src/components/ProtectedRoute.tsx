/**
 * ProtectedRoute Component
 *
 * Wrapper component that validates user permissions before rendering content
 * Shows loading state during permission verification and redirects to unauthorized on failure
 */

import React, { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { usePermission } from '../contexts/PermissionContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission: string
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  requiredPermission,
  fallback,
}: ProtectedRouteProps) {
  const navigate = useNavigate()
  const { checkPermission } = usePermission()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const validatePermission = async () => {
      try {
        const hasPermission = await checkPermission(requiredPermission)

        if (!hasPermission) {
          // Redirect to unauthorized page
          navigate({ to: '/unauthorized' })
          setIsAuthorized(false)
        } else {
          setIsAuthorized(true)
        }
      } catch (error) {
        console.error('Permission check failed:', error)
        navigate({ to: '/unauthorized' })
        setIsAuthorized(false)
      } finally {
        setIsChecking(false)
      }
    }

    validatePermission()
  }, [requiredPermission, checkPermission, navigate])

  // Show loading state during permission verification
  if (isChecking) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen bg-slate-950">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4" />
            <p className="text-slate-300">Verifying permissions...</p>
          </div>
        </div>
      )
    )
  }

  // Render children only if authorized
  return isAuthorized ? <>{children}</> : null
}
