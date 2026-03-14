import { useActivityFeed, type TimeRange, type EventTypeFilter } from '../../hooks/useActivityFeed'
import { ActivityFeedItem } from './ActivityFeedItem'

/**
 * ActivityFeed component
 *
 * Displays a paginated activity feed with temporal and type filtering controls.
 * Supports:
 * - Page-based navigation (Next/Previous buttons)
 * - Temporal filtering (24h, 7 days, 30 days)
 * - Event type filtering (All, Task, Sprint)
 * - Loading and empty states
 * - Accessible landmark roles and keyboard navigation
 *
 * @example
 * ```tsx
 * <ActivityFeed />
 * ```
 */
export function ActivityFeed() {
  const {
    activities,
    isLoading,
    isError,
    page,
    totalPages,
    goToNextPage,
    goToPrevPage,
    setTimeRange,
    setEventType,
    currentTimeRange,
    currentEventType,
  } = useActivityFeed()

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Activity Feed</h1>
          <p className="text-slate-400">Track all sprint and task events in one place</p>
        </div>

        {/* Filters */}
        <section
          className="bg-slate-900 rounded-lg p-6 mb-8"
          aria-label="Activity feed filters"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time Range Filter */}
            <div>
              <label
                htmlFor="time-range-select"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Time Range
              </label>
              <select
                id="time-range-select"
                value={currentTimeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            {/* Event Type Filter */}
            <div>
              <label
                htmlFor="event-type-select"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Event Type
              </label>
              <select
                id="event-type-select"
                value={currentEventType}
                onChange={(e) => setEventType(e.target.value as EventTypeFilter)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Events</option>
                <option value="task">Task Events</option>
                <option value="sprint">Sprint Events</option>
              </select>
            </div>
          </div>
        </section>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
            <p className="text-slate-400">Loading activity feed...</p>
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-400 mb-2">
              Error loading activity
            </h2>
            <p className="text-slate-400">
              Failed to fetch activity feed. Please try again later.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && activities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-slate-400 text-lg">No activity found for the selected filters</p>
          </div>
        )}

        {/* Activity List */}
        {!isLoading && !isError && activities.length > 0 && (
          <>
            <section
              className="space-y-4"
              aria-label="Activity events list"
              role="region"
              aria-live="polite"
            >
              {activities.map((event) => (
                <ActivityFeedItem key={event.id} event={event} />
              ))}
            </section>

            {/* Pagination Controls */}
            <nav
              className="mt-8 flex items-center justify-between"
              aria-label="Activity feed pagination"
            >
              <button
                onClick={goToPrevPage}
                disabled={page === 1}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                aria-label="Go to previous page"
              >
                ← Previous
              </button>

              <div className="flex items-center gap-2 text-slate-400">
                <span>
                  Page <span className="font-semibold text-white">{page}</span> of{' '}
                  <span className="font-semibold text-white">{totalPages}</span>
                </span>
              </div>

              <button
                onClick={goToNextPage}
                disabled={page >= totalPages}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                aria-label="Go to next page"
              >
                Next →
              </button>
            </nav>
          </>
        )}
      </div>
    </main>
  )
}
