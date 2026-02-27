import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Navigation } from '../components/Navigation'
import type { QueryClient } from '@tanstack/react-query'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  errorComponent: RootErrorBoundary,
})

function RootLayout() {
  return (
    <div className="flex h-screen bg-slate-900 text-white">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  )
}

function RootErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-900">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">
          Application Error
        </h1>
        <p className="text-slate-300 mb-4">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Reload Application
        </button>
      </div>
    </div>
  )
}
