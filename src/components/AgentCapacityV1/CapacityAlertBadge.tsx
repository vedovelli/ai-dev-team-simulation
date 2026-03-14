/**
 * CapacityAlertBadge Component
 *
 * Summary chip showing count of agents over 80% capacity.
 * Provides quick visual indicator of capacity concerns.
 */

interface CapacityAlertBadgeProps {
  overCapacityCount: number
  totalAgents: number
}

export function CapacityAlertBadge({
  overCapacityCount,
  totalAgents,
}: CapacityAlertBadgeProps) {
  if (overCapacityCount === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
          <span className="text-sm font-semibold text-green-700">✓</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900">All agents healthy</p>
          <p className="text-xs text-green-700">No agents over 80% capacity</p>
        </div>
      </div>
    )
  }

  const percentage = Math.round(
    (overCapacityCount / totalAgents) * 100
  )

  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
        <span className="text-sm font-semibold text-red-700">!</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-red-900">
          {overCapacityCount} {overCapacityCount === 1 ? 'agent' : 'agents'} over
          80% capacity
        </p>
        <p className="text-xs text-red-700">
          {percentage}% of team at or over capacity limits
        </p>
      </div>
    </div>
  )
}
