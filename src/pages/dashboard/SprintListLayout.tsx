import { useState, useMemo } from 'react'
import { useSprintsQuery } from '../../hooks/queries/useSprintsQuery'
import { Suspense } from 'react'
import { RouteErrorBoundary } from '../../components/RouteErrorBoundary'
import type { Sprint } from '../../types/sprint'

/**
 * SprintListLayout - Sprint list view with filters and search
 *
 * Displays all sprints with filtering by status and search by name.
 * Provides navigation to individual sprint details.
 */
export function SprintListLayout() {
  const { data: sprints, isLoading, error } = useSprintsQuery()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all')

  // Filter and search sprints
  const filteredSprints = useMemo(() => {
    if (!sprints) return []

    return sprints.filter((sprint) => {
      const matchesSearch = sprint.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || sprint.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [sprints, searchQuery, statusFilter])

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Sprints</h2>
          <p className="text-slate-400">View and manage all sprints</p>
        </div>
        <RouteErrorBoundary error={error} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Sprints</h2>
          <p className="text-slate-400">View and manage all sprints</p>
        </div>
        <div className="flex items-center justify-center py-16">
          <p className="text-slate-400">Loading sprints...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Sprints</h2>
        <p className="text-slate-400">View and manage all sprints</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search sprints..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-slate-600 transition-colors"
        >
          <option value="all">All Statuses</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Sprints Grid */}
      {filteredSprints.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSprints.map((sprint) => (
            <SprintCard key={sprint.id} sprint={sprint} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-400">No sprints found</p>
        </div>
      )}
    </div>
  )
}

interface SprintCardProps {
  sprint: Sprint
}

function SprintCard({ sprint }: SprintCardProps) {
  const progress = sprint.taskCount > 0 ? (sprint.completedCount / sprint.taskCount) * 100 : 0

  const statusColors: Record<string, string> = {
    planning: 'bg-blue-900/40 text-blue-300',
    active: 'bg-green-900/40 text-green-300',
    completed: 'bg-slate-700 text-slate-300',
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-semibold text-slate-100">{sprint.name}</h3>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[sprint.status]}`}>
          {sprint.status}
        </span>
      </div>

      {sprint.goals && (
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{sprint.goals}</p>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">Progress</span>
          <span className="text-xs font-medium text-slate-300">
            {sprint.completedCount} / {sprint.taskCount}
          </span>
        </div>
        <div
          className="w-full h-2 bg-slate-700 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${sprint.name} completion progress`}
        >
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{sprint.estimatedPoints} points</span>
        <a
          href={`/dashboard/sprints/${sprint.id}`}
          className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          View Details →
        </a>
      </div>
    </div>
  )
}
