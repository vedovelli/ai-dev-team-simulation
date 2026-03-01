import { useEffect, useState } from 'react'
import { useSearch } from '../hooks/useSearch'
import type { TaskStatus, TaskPriority } from '../types/task'

interface TaskFiltersProps {
  status?: TaskStatus | null
  priority?: TaskPriority | null
  search?: string
  team?: string
  sprint?: string
  assignee?: string
  onStatusChange?: (status: TaskStatus | null) => void
  onPriorityChange?: (priority: TaskPriority | null) => void
  onSearchChange?: (search: string) => void
  onTeamChange?: (team: string) => void
  onSprintChange?: (sprint: string) => void
  onAssigneeChange?: (assignee: string) => void
  onClearFilters?: () => void
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  done: 'Done',
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export function TaskFilters({
  status = null,
  priority = null,
  search = '',
  team = '',
  sprint = '',
  assignee = '',
  onStatusChange,
  onPriorityChange,
  onSearchChange,
  onTeamChange,
  onSprintChange,
  onAssigneeChange,
  onClearFilters,
}: TaskFiltersProps) {
  const { localValue: localSearch, handleChange: handleSearchChange } = useSearch(
    search,
    onSearchChange
  )
  const [localTeam, setLocalTeam] = useState(team)
  const [localSprint, setLocalSprint] = useState(sprint)
  const [localAssignee, setLocalAssignee] = useState(assignee)

  useEffect(() => {
    setLocalTeam(team)
  }, [team])

  useEffect(() => {
    setLocalSprint(sprint)
  }, [sprint])

  useEffect(() => {
    setLocalAssignee(assignee)
  }, [assignee])

  const allStatuses: TaskStatus[] = [
    'backlog',
    'in-progress',
    'in-review',
    'done',
  ]
  const allPriorities: TaskPriority[] = ['low', 'medium', 'high']

  const hasActiveFilters =
    status || priority || localSearch || team || sprint || assignee

  const activeFilterCount = [
    status,
    priority,
    localSearch,
    team,
    sprint,
    assignee,
  ].filter(Boolean).length

  return (
    <div className="mb-6 space-y-4 rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            {activeFilterCount} active
          </span>
        )}
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Status</h3>
        <div className="flex flex-wrap gap-2">
          {allStatuses.map((s) => (
            <button
              key={s}
              onClick={() =>
                onStatusChange?.(status === s ? null : s)
              }
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                status === s
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Priority</h3>
        <div className="flex flex-wrap gap-2">
          {allPriorities.map((p) => (
            <button
              key={p}
              onClick={() =>
                onPriorityChange?.(
                  priority === p ? null : p
                )
              }
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                priority === p
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Search</h3>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by task title..."
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Team</h3>
        <input
          type="text"
          value={localTeam}
          onChange={(e) => {
            setLocalTeam(e.target.value)
            onTeamChange?.(e.target.value)
          }}
          placeholder="Filter by team..."
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Sprint</h3>
        <input
          type="text"
          value={localSprint}
          onChange={(e) => {
            setLocalSprint(e.target.value)
            onSprintChange?.(e.target.value)
          }}
          placeholder="Filter by sprint..."
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Assignee</h3>
        <input
          type="text"
          value={localAssignee}
          onChange={(e) => {
            setLocalAssignee(e.target.value)
            onAssigneeChange?.(e.target.value)
          }}
          placeholder="Filter by assignee..."
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {hasActiveFilters && (
        <div>
          <button
            onClick={onClearFilters}
            className="rounded bg-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-400"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  )
}
