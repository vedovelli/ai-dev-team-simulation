interface BlockingStatusBadgeProps {
  isBlocked?: boolean
  blockingCount?: number
}

/**
 * Shows the blocking status of a task:
 * - "Blocked" in red if task is blocked by other tasks
 * - "Blocking N tasks" in orange if task is blocking others
 * - Nothing if task is not blocked and not blocking anything
 */
export function BlockingStatusBadge({ isBlocked = false, blockingCount = 0 }: BlockingStatusBadgeProps) {
  if (isBlocked) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"
        aria-label="Task is blocked"
      >
        🔒 Blocked
      </span>
    )
  }

  if (blockingCount > 0) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700"
        aria-label={`Task is blocking ${blockingCount} other task${blockingCount !== 1 ? 's' : ''}`}
      >
        ⚠️ Blocking {blockingCount}
      </span>
    )
  }

  return null
}
