/**
 * NotificationLoadingSkeleton Component
 *
 * Skeleton placeholder rows shown while notification data is loading.
 * Provides visual feedback that content is being fetched.
 */
export function NotificationLoadingSkeleton() {
  return (
    <div className="divide-y divide-gray-200">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="px-4 py-3 animate-pulse">
          <div className="flex gap-3 items-start">
            {/* Icon skeleton */}
            <div className="flex-shrink-0 w-5 h-5 bg-gray-200 rounded-full" />

            {/* Content skeleton */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>

            {/* Indicator skeleton */}
            <div className="flex-shrink-0 w-2 h-2 bg-gray-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
