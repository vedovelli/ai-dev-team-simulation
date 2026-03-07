import { Suspense } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { TaskDetailView } from '../../components/TaskDetailView'
import { useTaskDetails } from '../../hooks/useTaskDetails'
import { RouteErrorBoundary } from '../../components/RouteErrorBoundary'

/* eslint-disable react-refresh/only-export-components */
function TaskDetailRoute() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { task, isLoading, error, updateTaskStatus, isUpdating } = useTaskDetails({
    taskId: id,
  })

  if (error) {
    return (
      <RouteErrorBoundary
        error={error}
        resetError={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <button
            onClick={() => navigate({ to: '/agent-tasks/' })}
            className="text-sm text-blue-600 hover:text-blue-800 underline mb-4"
          >
            ← Back to Task Queue
          </button>

          <h1 className="text-3xl font-bold text-gray-900">Task Details</h1>
        </div>

        {/* Detail View */}
        <TaskDetailView
          task={task}
          isLoading={isLoading}
          isUpdating={isUpdating}
          onStatusChange={updateTaskStatus}
        />
      </div>
    </div>
  )
}

function TaskDetailRouteWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Task Details</h1>
            <div className="flex items-center justify-center py-16">
              <p className="text-gray-600">Loading task details...</p>
            </div>
          </div>
        </div>
      }
    >
      <TaskDetailRoute />
    </Suspense>
  )
}

export const Route = createFileRoute('/agent-tasks/$id')({
  component: TaskDetailRouteWrapper,
  errorComponent: ({ error }) => <RouteErrorBoundary error={error} />,
})
