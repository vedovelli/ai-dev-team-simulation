import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useMemo } from 'react'
import { RouteErrorBoundary } from '../../../components/RouteErrorBoundary'
import { AgentCapacityDashboard } from '../../../pages/dashboard/AgentCapacityDashboard'

function AgentCapacityPage() {
  const { sprintId } = Route.useSearch() as { sprintId?: string }

  // Default to first active sprint if not provided
  const resolvedSprintId = useMemo(
    () => sprintId || 'sprint-1',
    [sprintId]
  )

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <p className="text-slate-400">Loading agent capacity dashboard...</p>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Agent Capacity Dashboard
          </h1>
          <p className="mt-2 text-slate-600">
            Monitor and manage agent workload and capacity across the sprint
          </p>
        </div>
        <AgentCapacityDashboard sprintId={resolvedSprintId} />
      </div>
    </Suspense>
  )
}

export const Route = createFileRoute('/dashboard/agents/capacity')({
  component: AgentCapacityPage,
  errorComponent: ({ error }) => <RouteErrorBoundary error={error} />,
  validateSearch: (search: Record<string, unknown>) => ({
    sprintId: (search.sprintId as string) || undefined,
  }),
})
