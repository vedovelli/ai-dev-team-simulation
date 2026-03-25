import { useTaskSearch } from '../../hooks/useTaskSearch'
import { SearchBar } from '../SearchBar/SearchBar'
import { SearchResultsPanel } from './SearchResultsPanel'
import type { SearchFilters } from '../../types/search'

interface GlobalSearchProps {
  className?: string
}

/**
 * GlobalSearch container component
 *
 * Integrates SearchBar and SearchResultsPanel with useTaskSearch hook
 * Features:
 * - Debounced query input
 * - Task result display with filters
 * - "My overdue tasks" default view
 * - Full TanStack Query integration
 */
export function GlobalSearch({ className = '' }: GlobalSearchProps) {
  const search = useTaskSearch()

  const {
    results,
    isLoading,
    debouncedQuery: query,
    setQuery,
    setFilters,
  } = search

  const isEmpty = !query.trim()

  const handleMyOverdueTasksClick = () => {
    // Set filter for overdue tasks
    const today = new Date().toISOString().split('T')[0]
    const overdueDateRange: SearchFilters = {
      dateRange: {
        to: today,
      },
      status: ['blocked', 'in-progress'],
    }
    setFilters(overdueDateRange)
  }

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Search Input */}
      <SearchBar
        value={query}
        onChange={setQuery}
        isFetching={isLoading}
        placeholder="Search tasks by title or description..."
      />

      {/* Results Panel */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30">
        <SearchResultsPanel
          results={results}
          isLoading={isLoading}
          isEmpty={isEmpty}
          onMyOverdueTasksClick={handleMyOverdueTasksClick}
        />
      </div>

      {/* Results count */}
      {!isEmpty && results.length > 0 && (
        <div className="text-xs text-slate-500 px-1">
          Found {results.length} result{results.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
