/**
 * Unauthorized Access Page
 *
 * Displayed when a user lacks the required permissions to access a protected route
 */

import { createFileRoute, Link } from '@tanstack/react-router'

function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="text-6xl font-bold text-red-500">403</div>
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="text-slate-400">
            You don't have permission to access this resource. Please contact your administrator if you believe this is a mistake.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors text-center"
          >
            Return to Home
          </Link>
          <Link
            to="/dashboard"
            className="block w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded transition-colors text-center"
          >
            Go to Dashboard
          </Link>
        </div>

        <div className="pt-8 border-t border-slate-700">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Your Access Level</h2>
          <p className="text-xs text-slate-500">
            If you need access to this feature, please request it from your team administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/unauthorized')({
  component: UnauthorizedPage,
})
