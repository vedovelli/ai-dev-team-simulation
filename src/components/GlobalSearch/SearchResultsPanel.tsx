import type { SearchResult } from '../../types/search'

interface SearchResultsPanelProps {
  results: SearchResult[]
  isLoading: boolean
  isEmpty: boolean
  onMyOverdueTasksClick?: () => void
}

/**
 * Truncate text to 80 characters with ellipsis
 */
function truncateDescription(text: string, maxLength: number = 80): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Get status badge color based on task status
 */
function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-900/30 text-green-300 border border-green-700/50'
    case 'in-progress':
      return 'bg-blue-900/30 text-blue-300 border border-blue-700/50'
    case 'in-review':
      return 'bg-purple-900/30 text-purple-300 border border-purple-700/50'
    case 'blocked':
      return 'bg-red-900/30 text-red-300 border border-red-700/50'
    default:
      return 'bg-slate-800/30 text-slate-300 border border-slate-700/50'
  }
}

/**
 * TaskResultCard component - displays individual task search result
 */
function TaskResultCard({ result }: { result: SearchResult }) {
  return (
    <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer">
      <div className="space-y-2">
        {/* Title */}
        <h3 className="font-medium text-white text-sm truncate">{result.title}</h3>

        {/* Sprint and Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
            {result.sprint}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded font-medium ${getStatusBadgeColor(result.status)}`}
          >
            {result.status}
          </span>
        </div>

        {/* Description */}
        {result.description && (
          <p className="text-xs text-slate-400 line-clamp-2">
            {truncateDescription(result.description)}
          </p>
        )}

        {/* Assignee */}
        <div className="flex items-center gap-2 pt-1">
          <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
            {result.assignee.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-slate-400">{result.assignee}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * SearchResultsPanel component
 *
 * Features:
 * - Renders list of task result cards
 * - Shows empty state with "My overdue tasks" default view
 * - Shows "No results" state when query returns 0 items
 * - Displays task title, sprint name, status badge, assignee avatar
 * - Truncates description to 80 chars with ellipsis
 */
export function SearchResultsPanel({
  results,
  isLoading,
  isEmpty,
  onMyOverdueTasksClick,
}: SearchResultsPanelProps) {
  // Empty state - no query entered
  if (isEmpty && !isLoading) {
    return (
      <div className="py-12 px-4 text-center">
        <svg
          className="w-16 h-16 text-slate-600 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-white mb-2">Search for tasks</h2>
        <p className="text-slate-400 mb-6">
          Type to find tasks by title or description
        </p>

        {/* My overdue tasks default view button */}
        <button
          onClick={onMyOverdueTasksClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900/30 text-blue-300 border border-blue-700/50 hover:bg-blue-900/50 transition-colors text-sm font-medium"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          My overdue tasks
        </button>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-lg border border-slate-700 bg-slate-800/50 animate-pulse"
          >
            <div className="h-4 bg-slate-700 rounded w-3/4 mb-3" />
            <div className="flex gap-2 mb-3">
              <div className="h-6 bg-slate-700 rounded w-16" />
              <div className="h-6 bg-slate-700 rounded w-20" />
            </div>
            <div className="h-3 bg-slate-700 rounded w-24" />
          </div>
        ))}
      </div>
    )
  }

  // No results state
  if (results.length === 0) {
    return (
      <div className="py-12 px-4 text-center">
        <svg
          className="w-16 h-16 text-slate-600 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-white mb-2">No results found</h2>
        <p className="text-slate-400">
          Try adjusting your search terms
        </p>
      </div>
    )
  }

  // Results view
  return (
    <div className="space-y-3 py-4">
      {results.map((result) => (
        <TaskResultCard key={result.id} result={result} />
      ))}
    </div>
  )
}
