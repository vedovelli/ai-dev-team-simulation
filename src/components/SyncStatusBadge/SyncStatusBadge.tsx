import { Loader2 } from 'lucide-react'
import type { SyncStatus } from '../../hooks/useSprintMetrics'

interface SyncStatusBadgeProps {
  status: SyncStatus
}

/**
 * Subtle sync status indicator badge for dashboard header.
 * Shows real-time visibility into data refresh state without being intrusive.
 */
export function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
  if (status === 'idle') {
    // Use visibility: hidden to preserve space while preventing layout shift
    return <div className="h-6 invisible" aria-hidden="true" />
  }

  if (status === 'syncing') {
    return (
      <div
        className="flex items-center gap-2 text-xs text-slate-400 px-2 py-1 rounded"
        role="status"
        aria-live="polite"
        aria-label="Data is syncing"
      >
        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
        <span>Syncing...</span>
      </div>
    )
  }

  if (status === 'stale') {
    return (
      <div
        className="flex items-center gap-2 text-xs text-amber-600 px-2 py-1 rounded bg-amber-950/30"
        role="status"
        aria-live="polite"
        aria-label="Data may be outdated"
      >
        <span>Data may be outdated</span>
      </div>
    )
  }

  return null
}
