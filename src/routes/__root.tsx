import { createRootRouteWithContext, Outlet, Link, isRouterError } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { ToastProvider } from '../components/Toast'
import { ToastContainer } from '../components/NotificationCenter'
import { NotificationBell } from '../components/NotificationBell'
import { AppNotificationCenter } from '../components/AppNotificationCenter'
import { Sidebar } from '../components/Sidebar'
import { RouteErrorBoundary, NotFoundError } from '../components/RouteErrorBoundary'
import { PermissionProvider } from '../contexts/PermissionContext'
import { NotificationCenterProvider } from '../context/NotificationCenterContext'
import { useNotificationCenter } from '../hooks/useNotificationCenter'
import { NotificationCenterModal } from '../components/NotificationCenter/NotificationCenterModal'

interface RouterContext {
  queryClient: QueryClient
}

/**
 * Navbar Content Component
 * Separated to use NotificationCenter context
 */
function NavbarContent() {
  const { isPanelOpen, closePanel } = useNotificationCenter()

  return (
    <>
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
            <NotificationBell />
          </div>
        </div>
      </nav>

      {/* Notification Center Modal */}
      <NotificationCenterModal isOpen={isPanelOpen} onClose={closePanel} />
    </>
  )
}

function RootLayout() {
  return (
    <PermissionProvider>
      <ToastProvider>
        <NotificationCenterProvider>
          <div className="flex min-h-screen bg-slate-950 text-white">
            <Sidebar />
            <AppNotificationCenter />
            <div className="flex-1 flex flex-col">
              <NavbarContent />
              <ToastContainer />
              <main className="flex-1">
                <Outlet />
              </main>
              {import.meta.env.DEV && <TanStackRouterDevtools />}
            </div>
          </div>
        </NotificationCenterProvider>
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
