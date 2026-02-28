import { createRootRouteWithContext, Outlet, Link, isRouterError } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { ToastProvider } from '../components/Toast'

interface RouterContext {
  queryClient: QueryClient
}

function RootLayout() {
  return (
    <ToastProvider>
      <div className="flex flex-col min-h-screen bg-slate-950 text-white">
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
                <div className="flex gap-6">
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
            </div>
          </div>
        </nav>
        <main className="flex-1">
          <Outlet />
        </main>
        {import.meta.env.DEV && <TanStackRouterDevtools />}
      </div>
    </ToastProvider>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  errorComponent: ({ error }: { error: unknown }) => {
    if (isRouterError(error)) {
      if (error.isNotFound) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-red-500 mb-2">404</h1>
              <p className="text-slate-400 mb-4">Page not found</p>
              <Link to="/" className="text-blue-400 hover:text-blue-300">
                Go home
              </Link>
            </div>
          </div>
        )
      }
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-2">Error</h1>
          <p className="text-slate-400 mb-4">Something went wrong</p>
          <Link to="/" className="text-blue-400 hover:text-blue-300">
            Go home
          </Link>
        </div>
      </div>
    )
  },
})
