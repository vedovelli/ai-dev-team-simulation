/**
 * LoadingFallback Component
 *
 * Reusable skeleton loading state for data-fetching regions.
 * Shows animated skeleton placeholders while data is loading.
 */

interface LoadingFallbackProps {
  /** Message to display during loading */
  message?: string
  /** Number of skeleton rows to show */
  rowCount?: number
  /** Variant of skeleton to display: 'table', 'card', or 'list' */
  variant?: 'table' | 'card' | 'list'
}

/**
 * Animated skeleton row for table-like loading
 */
function SkeletonRow({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-4 mb-4 px-4 py-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-6 bg-slate-700 rounded animate-pulse flex-1"
          style={{
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Animated skeleton card for grid-like loading
 */
function SkeletonCard() {
  return (
    <div className="bg-slate-800 rounded-lg p-4 space-y-3">
      <div className="h-6 bg-slate-700 rounded animate-pulse w-2/3" />
      <div className="h-4 bg-slate-700 rounded animate-pulse" />
      <div className="h-4 bg-slate-700 rounded animate-pulse w-5/6" />
      <div className="h-8 bg-slate-700 rounded animate-pulse mt-4" />
    </div>
  )
}

/**
 * LoadingFallback Component
 *
 * Displays a skeleton loading state with ARIA announcements
 *
 * @example
 * ```tsx
 * {isLoading ? (
 *   <LoadingFallback variant="table" rowCount={5} />
 * ) : (
 *   <MyTable data={data} />
 * )}
 * ```
 */
export function LoadingFallback({
  message = 'Loading data...',
  rowCount = 5,
  variant = 'table',
}: LoadingFallbackProps) {
  return (
    <div
      className="w-full"
      role="status"
      aria-live="polite"
      aria-label="Loading content"
    >
      {variant === 'table' && (
        <div className="space-y-0 border border-slate-700 rounded-lg overflow-hidden">
          {Array.from({ length: rowCount }).map((_, i) => (
            <div key={i} className="border-b border-slate-700 last:border-b-0">
              <SkeletonRow />
            </div>
          ))}
        </div>
      )}

      {variant === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: rowCount }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {variant === 'list' && (
        <div className="space-y-3">
          {Array.from({ length: rowCount }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-800 rounded-lg p-4 space-y-2"
            >
              <div className="h-5 bg-slate-700 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-slate-700 rounded animate-pulse w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Accessible message for screen readers */}
      <p className="sr-only">{message}</p>
    </div>
  )
}
