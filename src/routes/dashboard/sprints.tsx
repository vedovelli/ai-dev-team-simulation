import { createFileRoute } from '@tanstack/react-router'
import { SprintListLayout } from '../../pages/dashboard/SprintListLayout'
import { Suspense } from 'react'
import { RouteErrorBoundary } from '../../components/RouteErrorBoundary'

function SprintListPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <p className="text-slate-400">Loading sprints...</p>
        </div>
      }
    >
      <SprintListLayout />
    </Suspense>
  )
}

export const Route = createFileRoute('/dashboard/sprints')({
  component: SprintListPage,
  errorComponent: ({ error }) => <RouteErrorBoundary error={error} />,
})
