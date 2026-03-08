import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { TaskDetailPanel } from '../features/tasks/components/TaskDetailPanel'
import { RouteErrorBoundary } from '../components/RouteErrorBoundary'

/* eslint-disable react-refresh/only-export-components */
function TaskDetailRoute() {
  const { taskId } = Route.useParams()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <a
            href="/tasks"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Tasks
          </a>
        </div>

        <TaskDetailPanel taskId={taskId} />
      </div>
    </div>
  )
}

function TaskDetailRouteWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center py-16">
              <p className="text-gray-500">Loading task details...</p>
            </div>
          </div>
        </div>
      }
    >
      <TaskDetailRoute />
    </Suspense>
  )
}

export const Route = createFileRoute('/tasks/$taskId')({
  component: TaskDetailRouteWrapper,
  errorComponent: ({ error }) => (
    <RouteErrorBoundary error={error} />
  ),
})
