/**
 * NotificationEmptyState Component
 *
 * Empty state illustration and message shown when no notifications exist
 */
export function NotificationEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <svg
        className="w-16 h-16 text-gray-300 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <p className="text-gray-700 font-medium text-center">
        No notifications yet
      </p>
      <p className="text-gray-500 text-sm text-center mt-1">
        You're all caught up!
      </p>
    </div>
  )
}
