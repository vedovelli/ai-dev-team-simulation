import { useState, useCallback } from 'react'
import { useTaskSearch } from '../../hooks/useTaskSearch'
import { TaskSearchFilters } from './TaskSearchFilters'
import { TaskSearchResults } from './TaskSearchResults'
import type { TaskSearchFilters as TaskSearchFiltersType } from '../../types/task-search'

interface TaskSearchSidebarProps {
  onTaskSelect?: (taskId: string) => void
  isOpen?: boolean
  onToggle?: (isOpen: boolean) => void
  className?: string
}

export function TaskSearchSidebar({
  onTaskSelect,
  isOpen = true,
  onToggle,
  className = '',
}: TaskSearchSidebarProps) {
  const [localIsOpen, setLocalIsOpen] = useState(isOpen)
  const search = useTaskSearch()

  // Handle sidebar toggle
  const handleToggle = useCallback(() => {
    const newState = !localIsOpen
    setLocalIsOpen(newState)
    onToggle?.(newState)
  }, [localIsOpen, onToggle])

  // Handle filter changes
  const handleFiltersChange = (newFilters: TaskSearchFiltersType) => {
    search.setFilters(newFilters)
  }

  // Handle clear all filters
  const handleClearAllFilters = () => {
    search.setFilters({})
    search.setQuery('')
    search.setPage(1)
  }

  // Handle task selection
  const handleTaskSelect = useCallback(
    (taskId: string) => {
      onTaskSelect?.(taskId)
    },
    [onTaskSelect]
  )

  // Check if any filters are active
  const hasActiveFilters =
    search.debouncedQuery.length > 0 ||
    Object.values(search.results).some((v) => v !== undefined)

  return (
    <div className={`flex flex-col h-full bg-slate-900 border-r border-slate-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Task Search
        </h2>
        <button
          onClick={handleToggle}
          className="p-1.5 rounded hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-300"
          aria-label={localIsOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${localIsOpen ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {localIsOpen && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Search Input */}
          <div className="px-4 py-3 border-b border-slate-700">
            <div className="relative">
              <label
                htmlFor="task-search-input"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2"
              >
                Search Tasks
              </label>
              <div className="relative flex items-center">
                <svg
                  className="absolute left-3 w-4 h-4 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  id="task-search-input"
                  type="text"
                  role="search"
                  value={search.debouncedQuery}
                  onChange={(e) => search.setQuery(e.target.value)}
                  placeholder="Search by title..."
                  aria-label="Search tasks by title"
                  className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {search.isLoading ? 'Searching...' : 'Debounced 300ms'}
              </p>
            </div>
          </div>

          {/* Filters Section */}
          <TaskSearchFilters
            filters={search.debouncedQuery ? { q: search.debouncedQuery } : {}}
            onFiltersChange={handleFiltersChange}
            facets={search.facets}
            onClearAll={handleClearAllFilters}
            hasActiveFilters={hasActiveFilters}
            isExpanded
          />

          {/* Results Section */}
          <div className="flex-1 overflow-hidden flex flex-col px-4 py-3">
            <div
              className="flex-1 overflow-y-auto"
              role="region"
              aria-label="Search results"
              aria-live="polite"
            >
              <TaskSearchResults
                results={search.results}
                isLoading={search.isLoading}
                isError={search.isError}
                error={search.error}
                onRetry={() => {
                  // Trigger a refetch by changing query
                  search.setQuery(search.debouncedQuery)
                }}
                onSelectTask={handleTaskSelect}
                totalResults={search.pagination.total}
                currentPage={search.pagination.page}
              />
            </div>
          </div>

          {/* Pagination Controls */}
          {search.pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/50">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => search.setPage(Math.max(1, search.pagination.page - 1))}
                  disabled={search.pagination.page <= 1}
                  className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors"
                  aria-label="Previous page"
                >
                  ← Prev
                </button>

                <span className="text-xs text-slate-400">
                  Page {search.pagination.page} of {search.pagination.totalPages}
                </span>

                <button
                  onClick={() =>
                    search.setPage(Math.min(search.pagination.totalPages, search.pagination.page + 1))
                  }
                  disabled={search.pagination.page >= search.pagination.totalPages}
                  className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors"
                  aria-label="Next page"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
