import { Outlet, useParams } from '@tanstack/react-router'
import { useSprintDetails } from '../../hooks/queries/sprints'
import { Suspense, useState } from 'react'
import { RouteErrorBoundary } from '../../components/RouteErrorBoundary'
import { SprintReportModal } from '../../components/SprintReportModal'
import type { Sprint } from '../../types/sprint'

/**
 * SprintDetailLayout - Individual sprint detail view
 *
 * Displays a specific sprint's information with nested child routes
 * for tasks, health metrics, and dashboard views.
 */
export function SprintDetailLayout() {
  const { id: sprintId } = useParams({ from: '/dashboard/sprints/$id' })
  const { data: sprint, isLoading, error } = useSprintDetails(sprintId)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  if (error) {
    return <RouteErrorBoundary error={error} />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-400">Loading sprint details...</p>
      </div>
    )
  }

  if (!sprint) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">Sprint not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sprint Header */}
      <SprintDetailHeader sprint={sprint} onOpenReport={() => setIsReportModalOpen(true)} />

      {/* Sprint Report Modal */}
      <SprintReportModal
        sprintId={sprintId}
        sprintName={sprint.name}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Nested Content */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16">
            <p className="text-slate-400">Loading...</p>
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </div>
  )
}

interface SprintDetailHeaderProps {
  sprint: Sprint
  onOpenReport: () => void
}

function SprintDetailHeader({ sprint, onOpenReport }: SprintDetailHeaderProps) {
  const progress = sprint.taskCount > 0 ? (sprint.completedCount / sprint.taskCount) * 100 : 0

  const statusColors: Record<string, string> = {
    planning: 'bg-blue-900/40 text-blue-300',
    active: 'bg-green-900/40 text-green-300',
    completed: 'bg-slate-700 text-slate-300',
  }

  const daysRemaining =
    sprint.endDate && sprint.endDate.trim() !== ''
      ? Math.ceil((new Date(sprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">{sprint.name}</h1>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColors[sprint.status]}`}>
            {sprint.status}
          </span>
        </div>
        <div className="text-right space-y-3">
          <div>
            <div className="text-2xl font-bold text-slate-100">{sprint.estimatedPoints}</div>
            <p className="text-sm text-slate-400">Story Points</p>
          </div>
          <button
            onClick={onOpenReport}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            📊 View Report
          </button>
        </div>
      </div>

      {sprint.goals && (
        <p className="text-slate-300 mb-6">{sprint.goals}</p>
      )}

      {/* Progress Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <StatBox
          label="Completed Tasks"
          value={sprint.completedCount}
          total={sprint.taskCount}
        />
        <StatBox
          label="Progress"
          value={`${Math.round(progress)}%`}
        />
        <StatBox
          label="Days Remaining"
          value={daysRemaining !== null && daysRemaining > 0 ? daysRemaining : 'Ended'}
        />
        <StatBox
          label="Status"
          value={sprint.status}
        />
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Overall Progress</span>
          <span className="text-sm font-medium text-slate-300">
            {sprint.completedCount} / {sprint.taskCount} tasks
          </span>
        </div>
        <div
          className="w-full h-3 bg-slate-700 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Sprint completion progress"
        >
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

interface StatBoxProps {
  label: string
  value: string | number
  total?: number
}

function StatBox({ label, value, total }: StatBoxProps) {
  return (
    <div className="bg-slate-700/50 rounded p-4">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      <p className="text-xl font-bold text-slate-100">
        {value}
        {total && <span className="text-sm text-slate-400 ml-1">/ {total}</span>}
      </p>
    </div>
  )
}
