import { type ReactNode } from 'react'
import type { WorkloadAnalyticsFilters } from '../../hooks/useWorkloadAnalytics'

interface WorkloadFilterBarProps {
  filters: WorkloadAnalyticsFilters
  onFiltersChange: (filters: WorkloadAnalyticsFilters) => void
  skillTags?: string[]
  children?: ReactNode
}

/**
 * Filter bar for workload dashboard
 * Allows filtering by timeframe, skill tags, project, and status
 */
export function WorkloadFilterBar({
  filters,
  onFiltersChange,
  skillTags = [],
  children,
}: WorkloadFilterBarProps) {
  const handleTimeframeChange = (timeframe: '7d' | '30d') => {
    onFiltersChange({ ...filters, timeframe })
  }

  const handleSkillTagChange = (tag: string) => {
    onFiltersChange({
      ...filters,
      skillTag: filters.skillTag === tag ? undefined : tag,
    })
  }

  const handleStatusChange = (status: 'available' | 'busy' | 'overloaded' | undefined) => {
    onFiltersChange({ ...filters, status })
  }

  const handleClearFilters = () => {
    onFiltersChange({})
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        {/* Timeframe selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Timeframe:</label>
          <select
            value={filters.timeframe || '7d'}
            onChange={(e) => handleTimeframeChange(e.target.value as '7d' | '30d')}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
          >
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="overloaded">Overloaded</option>
          </select>
        </div>

        {/* Skill tag filter */}
        {skillTags.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Skills:</label>
            <select
              value={filters.skillTag || ''}
              onChange={(e) => handleSkillTagChange(e.target.value)}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
            >
              <option value="">All skills</option>
              {skillTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Clear filters button */}
        <button
          onClick={handleClearFilters}
          className="rounded bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Clear filters
        </button>
      </div>

      {/* Additional content area */}
      {children && <div className="border-t border-gray-200 pt-4">{children}</div>}
    </div>
  )
}
