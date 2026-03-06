import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { SprintList } from '../../components/SprintList'
import { RouteErrorBoundary } from '../../components/RouteErrorBoundary'

function SprintListPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Sprint Management</h1>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16">
              <p className="text-slate-400">Loading sprints...</p>
            </div>
          }
        >
          <SprintList />
        </Suspense>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/sprints/')({
  component: SprintListPage,
  errorComponent: ({ error }) => (
    <RouteErrorBoundary error={error} />
  ),
})
