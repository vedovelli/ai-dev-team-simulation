import { useSearch } from '@tanstack/react-router'

interface AnalyticsFiltersProps {
  sprints: string[]
  onSprintChange: (sprint: string | null) => void
  onStatusChange: (status: string | null) => void
}

type AnalyticsSearch = {
  sprint?: string
  status?: string
}

export function AnalyticsFilters({
  sprints,
  onSprintChange,
  onStatusChange,
}: AnalyticsFiltersProps) {
  const searchParams = useSearch({ from: '__root__' }) as AnalyticsSearch

  const currentSprint = searchParams.sprint || ''
  const currentStatus = searchParams.status || ''

  const statuses = ['backlog', 'in-progress', 'in-review', 'done']

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
      <h3 className="text-lg font-semibold mb-4">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Sprint
          </label>
          <select
            value={currentSprint}
            onChange={(e) => onSprintChange(e.target.value || null)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Sprints</option>
            {sprints.map((sprint) => (
              <option key={sprint} value={sprint}>
                {sprint}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Status
          </label>
          <select
            value={currentStatus}
            onChange={(e) => onStatusChange(e.target.value || null)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.replace(/-/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
