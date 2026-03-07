/**
 * Protected Dashboard Route
 *
 * Example implementation of a route protected by permission guards
 * Demonstrates the ProtectedRoute component with permission validation
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { usePermission } from '../contexts/PermissionContext'
import { useState, useEffect } from 'react'

function ProtectedDashboardContent() {
  const { userRole, permissionCache } = usePermission()
  const [allPermissions, setAllPermissions] = useState<string[]>([])

  // Display all cached permissions for demonstration
  useEffect(() => {
    const permissions = Array.from(permissionCache.keys()).filter(
      (key) => permissionCache.get(key) === true
    )
    setAllPermissions(permissions)
  }, [permissionCache])

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Protected Dashboard</h1>
        <p className="text-slate-400">
          You have successfully accessed a protected resource. This page requires valid permissions.
        </p>
      </div>

      {/* User Info Section */}
      <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-4">Your Access Level</h2>
        <div className="space-y-3">
          <div className="flex items-center">
            <span className="text-slate-400 w-32">Current Role:</span>
            <span className="font-semibold text-blue-400 capitalize">{userRole || 'Unknown'}</span>
          </div>
          <div className="text-sm text-slate-400">
            Your role determines which features and data you can access across the application.
          </div>
        </div>
      </div>

      {/* Permissions Section */}
      <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-4">Available Permissions</h2>
        {allPermissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allPermissions.map((permission) => (
              <div
                key={permission}
                className="bg-slate-800 rounded px-3 py-2 border border-slate-600 flex items-center"
              >
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-3" />
                <code className="text-sm text-slate-300">{permission}</code>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">
            Permissions are loaded asynchronously. Check back after the page fully loads.
          </p>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-4">Role-Based Features</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h3 className="font-semibold text-white">Admin Features</h3>
            <p className="text-sm text-slate-400">
              Manage users, roles, settings, and view analytics
            </p>
          </div>
          <div className="border-l-4 border-green-500 pl-4 py-2">
            <h3 className="font-semibold text-white">Developer Features</h3>
            <p className="text-sm text-slate-400">
              Create tasks, edit tasks, view code reviews
            </p>
          </div>
          <div className="border-l-4 border-slate-500 pl-4 py-2">
            <h3 className="font-semibold text-white">Viewer Features</h3>
            <p className="text-sm text-slate-400">
              View dashboards and analytics (read-only)
            </p>
          </div>
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-4">How This Works</h2>
        <ol className="space-y-3 text-slate-400 text-sm">
          <li className="flex gap-3">
            <span className="text-blue-400 font-semibold">1.</span>
            <span>
              PermissionProvider loads your user role from the API on page load
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-400 font-semibold">2.</span>
            <span>
              ProtectedRoute component checks if you have the required permission
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-400 font-semibold">3.</span>
            <span>
              Permission results are cached to avoid redundant API calls
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-400 font-semibold">4.</span>
            <span>
              If access is denied, you're redirected to the /unauthorized page
            </span>
          </li>
        </ol>
      </div>
    </div>
  )
}

function ProtectedDashboardPage() {
  return (
    <ProtectedRoute requiredPermission="view-protected-dashboard">
      <ProtectedDashboardContent />
    </ProtectedRoute>
  )
}

export const Route = createFileRoute('/protected-dashboard')({
  component: ProtectedDashboardPage,
})
