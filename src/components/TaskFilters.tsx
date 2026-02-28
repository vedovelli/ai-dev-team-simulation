import { useEffect, useState } from 'react'
import type { TaskStatus, TaskPriority } from '../types/task'

interface TaskFiltersProps {
  status?: TaskStatus | null
  priority?: TaskPriority | null
  search?: string
  onStatusChange?: (status: TaskStatus | null) => void
  onPriorityChange?: (priority: TaskPriority | null) => void
  onSearchChange?: (search: string) => void
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
  onStatusChange,
  onPriorityChange,
  onSearchChange,
}: TaskFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search)

  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange?.(localSearch)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch, search, onSearchChange])

  const allStatuses: TaskStatus[] = [
    'backlog',
    'in-progress',
    'in-review',
    'done',
  ]
  const allPriorities: TaskPriority[] = ['low', 'medium', 'high']

  return (
    <div className="mb-6 space-y-4 rounded-lg bg-white p-4 shadow-sm">
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
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search by task title..."
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>
    </div>
  )
}
