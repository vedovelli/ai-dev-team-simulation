import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Suspense } from 'react'
import { useSprintDetail } from '../../hooks/useSprintDetail'
import { useSprintTasks } from '../../hooks/useSprintTasks'
import { SprintTaskTable } from '../../components/SprintTaskTable'
import { RouteErrorBoundary } from '../../components/RouteErrorBoundary'

function SprintTasksContent({ id }: { id: string }) {
  const { data: sprint, isLoading: sprintLoading } = useSprintDetail(id)
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useSprintTasks(id)

  if (tasksError) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-red-400">
        <h3 className="font-semibold mb-2">Failed to load tasks</h3>
        <p className="text-sm">{tasksError.message}</p>
      </div>
    )
  }

  if (sprintLoading || tasksLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 h-16 animate-pulse" />
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 h-96 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-2">{sprint?.name} - Tasks</h1>
        <p className="text-slate-400">Total: {tasks.length} tasks</p>
      </div>

      {/* Tasks Table */}
      <SprintTaskTable tasks={tasks} isLoading={tasksLoading} />
    </div>
  )
}

function SprintTasksPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate({ to: `/sprints/$id`, params: { id } })}
          className="mb-6 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
        >
          ← Back to Sprint Detail
        </button>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16">
              <p className="text-slate-400">Loading tasks...</p>
            </div>
          }
        >
          <SprintTasksContent id={id} />
        </Suspense>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/sprints/$id/tasks')({
  component: SprintTasksPage,
  errorComponent: ({ error }) => (
    <RouteErrorBoundary error={error} />
  ),
})
