import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Suspense } from 'react'
import { useSprintDetail } from '../../hooks/useSprintDetail'
import { useSprintTasks } from '../../hooks/useSprintTasks'
import { SprintTaskTable } from '../../components/SprintTaskTable'
import { RouteErrorBoundary } from '../../components/RouteErrorBoundary'
import type { Sprint } from '../../types/sprint'

const STATUS_COLORS: Record<Sprint['status'], string> = {
  planning: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  completed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const STATUS_LABELS: Record<Sprint['status'], string> = {
  planning: 'Planning',
  active: 'Active',
  completed: 'Completed',
}

function SprintDetailContent({ id }: { id: string }) {
  const navigate = useNavigate()
  const { data: sprint, isLoading: sprintLoading, error: sprintError } = useSprintDetail(id)
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useSprintTasks(id)

  if (sprintError) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-red-400">
        <h3 className="font-semibold mb-2">Failed to load sprint</h3>
        <p className="text-sm">{sprintError.message}</p>
      </div>
    )
  }

  if (sprintLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 h-40 animate-pulse" />
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 h-64 animate-pulse" />
      </div>
    )
  }

  if (!sprint) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Sprint not found</p>
      </div>
    )
  }

  const progress = sprint.taskCount > 0 ? (sprint.completedCount / sprint.taskCount) * 100 : 0

  return (
    <div className="space-y-8">
      {/* Sprint Header */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{sprint.name}</h1>
            <p className="text-slate-300">{sprint.goals}</p>
          </div>
          <div className={`px-4 py-2 rounded-lg text-sm font-medium border ${STATUS_COLORS[sprint.status]}`}>
            {STATUS_LABELS[sprint.status]}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">Overall Progress</span>
            <span className="text-sm font-medium text-white">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Sprint Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Total Tasks</p>
            <p className="text-2xl font-bold text-white">{sprint.taskCount}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-400">{sprint.completedCount}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Remaining</p>
            <p className="text-2xl font-bold text-yellow-400">{sprint.taskCount - sprint.completedCount}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Story Points</p>
            <p className="text-2xl font-bold text-blue-400">{sprint.estimatedPoints}</p>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Tasks</h2>
          <button
            onClick={() => navigate({ to: `/sprints/$id/tasks`, params: { id: sprint.id } })}
            className="px-3 py-1 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 transition-colors"
          >
            View all
          </button>
        </div>
        <SprintTaskTable tasks={tasks} isLoading={tasksLoading} />
      </div>
    </div>
  )
}

function SprintDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate({ to: '/sprints' })}
          className="mb-6 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
        >
          ← Back to Sprints
        </button>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16">
              <p className="text-slate-400">Loading sprint details...</p>
            </div>
          }
        >
          <SprintDetailContent id={id} />
        </Suspense>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/sprints/$id')({
  component: SprintDetailPage,
  errorComponent: ({ error }) => (
    <RouteErrorBoundary error={error} />
  ),
})
