import { createRootRouteWithContext, Outlet, Link, isRouterError } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { ToastProvider } from '../components/Toast'
import { NotificationCenter, ToastContainer } from '../components/NotificationCenter'
import { Sidebar } from '../components/Sidebar'
import { RouteErrorBoundary, NotFoundError } from '../components/RouteErrorBoundary'
import { PermissionProvider } from '../contexts/PermissionContext'

interface RouterContext {
  queryClient: QueryClient
}

function RootLayout() {
  return (
    <PermissionProvider>
      <ToastProvider>
        <div className="flex min-h-screen bg-slate-950 text-white">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <nav className="bg-slate-900 border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-8">
                  <Link
                    to="/"
                    className="font-bold text-lg hover:text-slate-300 transition-colors"
                  >
                    AI Dev Team
                  </Link>
                  <div className="hidden md:flex gap-6">
                    <Link
                      to="/dashboard"
                      className="text-sm hover:text-slate-300 transition-colors"
                      activeProps={{
                        className: 'text-blue-400 font-semibold',
                      }}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/teams"
                      className="text-sm hover:text-slate-300 transition-colors"
                      activeProps={{
                        className: 'text-blue-400 font-semibold',
                      }}
                    >
                      Teams
                    </Link>
                    <Link
                      to="/kanban"
                      className="text-sm hover:text-slate-300 transition-colors"
                      activeProps={{
                        className: 'text-blue-400 font-semibold',
                      }}
                    >
                      Kanban Board
                    </Link>
                    <Link
                      to="/feed"
                      className="text-sm hover:text-slate-300 transition-colors"
                      activeProps={{
                        className: 'text-blue-400 font-semibold',
                      }}
                    >
                      Activity Feed
                    </Link>
                    <Link
                      to="/analytics-dashboard"
                      className="text-sm hover:text-slate-300 transition-colors"
                      activeProps={{
                        className: 'text-blue-400 font-semibold',
                      }}
                    >
                      Analytics
                    </Link>
                    <Link
                      to="/create"
                      className="text-sm hover:text-slate-300 transition-colors"
                      activeProps={{
                        className: 'text-blue-400 font-semibold',
                      }}
                    >
                      Create
                    </Link>
                  </div>
                </div>
                <NotificationCenter />
              </div>
            </div>
          </nav>
          <ToastContainer />
          <main className="flex-1">
            <Outlet />
          </main>
          {import.meta.env.DEV && <TanStackRouterDevtools />}
        </div>
      </div>
      </ToastProvider>
    </PermissionProvider>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  errorComponent: ({ error }) => {
    // Handle router errors with specific error boundaries
    if (isRouterError(error)) {
      if (error.isNotFound) {
        return <NotFoundError />
      }
    }
    // Generic error boundary for other errors
    return <RouteErrorBoundary error={error} />
  },
})
