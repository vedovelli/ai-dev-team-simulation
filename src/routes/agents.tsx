/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { RouteErrorBoundary } from '../components/RouteErrorBoundary'

// Layout loader for agents section
async function loadAgentsLayout() {
  // Could pre-fetch data shared across agents routes
  return null
}

export const Route = createFileRoute('/agents')({
  component: AgentsLayout,
  loader: loadAgentsLayout,
  errorComponent: ({ error }) => (
    <RouteErrorBoundary error={error} />
  ),
})

function AgentsLayout() {
  return (
    <div className="agents-layout">
      <Outlet />
    </div>
  )
}
