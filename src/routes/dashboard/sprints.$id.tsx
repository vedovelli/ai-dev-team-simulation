import { createFileRoute } from '@tanstack/react-router'
import { SprintDetailLayout } from '../../pages/dashboard/SprintDetailLayout'
import { Suspense } from 'react'
import { RouteErrorBoundary } from '../../components/RouteErrorBoundary'

function SprintDetailPage() {
  const { id } = Route.useParams()

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <p className="text-slate-400">Loading sprint details...</p>
        </div>
      }
    >
      <SprintDetailLayout sprintId={id} />
    </Suspense>
  )
}

export const Route = createFileRoute('/dashboard/sprints/$id')({
  component: SprintDetailPage,
  errorComponent: ({ error }) => <RouteErrorBoundary error={error} />,
})
