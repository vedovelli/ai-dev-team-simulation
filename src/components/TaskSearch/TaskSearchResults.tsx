import { TaskSearchResultCard } from './TaskSearchResultCard'
import type { SearchTask } from '../../types/task-search'

interface TaskSearchResultsProps {
  results: SearchTask[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  onRetry?: () => void
  onSelectTask?: (taskId: string) => void
  totalResults?: number
  currentPage?: number
}

export function TaskSearchResults({
  results,
  isLoading,
  isError,
  error,
  onRetry,
  onSelectTask,
  totalResults = 0,
  currentPage = 1,
}: TaskSearchResultsProps) {
  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-slate-400 mb-3">Loading results...</div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-lg border border-slate-700 bg-slate-800/50 animate-pulse"
          >
            <div className="h-4 bg-slate-700 rounded w-3/4 mb-3" />
            <div className="flex gap-2 mb-3">
              <div className="h-6 bg-slate-700 rounded-full w-16" />
              <div className="h-6 bg-slate-700 rounded-full w-20" />
            </div>
            <div className="flex justify-between items-center">
              <div className="h-3 bg-slate-700 rounded w-24" />
              <div className="h-3 bg-slate-700 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="rounded-lg border border-red-700 bg-red-900/20 p-4">
        <div className="flex items-start gap-3">
          <div className="text-red-400 mt-0.5">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-red-300 mb-1">Search Error</h3>
            <p className="text-sm text-red-200 mb-3">
              {error?.message || 'Failed to fetch search results'}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-sm rounded transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <svg
          className="w-12 h-12 text-slate-600 mx-auto mb-3"
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
        <p className="text-slate-400 font-medium mb-1">No tasks found</p>
        <p className="text-slate-500 text-sm">
          Try adjusting your search terms or filters
        </p>
      </div>
    )
  }

  // Results list
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 mb-3">
        <p className="text-sm text-slate-400">
          {results.length === 1
            ? '1 result'
            : `${results.length} of ${totalResults} results`}
        </p>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-500px)] overflow-y-auto">
        {results.map((task) => (
          <TaskSearchResultCard
            key={task.id}
            task={task}
            onSelect={onSelectTask}
          />
        ))}
      </div>
    </div>
  )
}
