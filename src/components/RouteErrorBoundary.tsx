import { Link, useRouter } from '@tanstack/react-router'

interface RouteErrorBoundaryProps {
  error: unknown
  resetError?: () => void
}

/**
 * Error boundary component for route-level errors
 * Displays user-friendly error messages and navigation options
 */
export function RouteErrorBoundary({ error, resetError }: RouteErrorBoundaryProps) {
  const router = useRouter()
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-900 border border-red-700 rounded-lg p-8">
          <h1 className="text-4xl font-bold text-red-300 mb-4">Error Loading Page</h1>
          <p className="text-red-200 mb-6 leading-relaxed">
            {errorMessage}
          </p>

          <div className="bg-red-950 rounded p-4 mb-6 max-h-64 overflow-auto">
            <pre className="text-sm text-red-100 font-mono whitespace-pre-wrap break-words">
              {error instanceof Error && error.stack}
            </pre>
          </div>

          <div className="flex gap-4">
            {resetError && (
              <button
                onClick={resetError}
                className="px-6 py-2 bg-red-700 hover:bg-red-600 rounded-lg font-semibold transition-colors"
              >
                Try Again
              </button>
            )}
            <button
              onClick={() => router.history.back()}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
            >
              Go Back
            </button>
            <Link
              to="/"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Error component for 404 Not Found errors
 */
export function NotFoundError() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-orange-500 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
          <p className="text-slate-400 mb-8">
            The page you're looking for doesn't exist
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Error component for unauthorized access
 */
export function UnauthorizedError() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-red-500 mb-4">403</h1>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-8">
            You don't have permission to access this page
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
