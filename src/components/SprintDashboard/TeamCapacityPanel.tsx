import { MetricCardSkeleton } from '../Skeletons'

export interface TeamMember {
  id: string
  name: string
  assignedTasks: number
  completedTasks: number
  capacity: number
}

interface TeamCapacityPanelProps {
  members: TeamMember[]
  isLoading?: boolean
  hasError?: boolean
  onRetry?: () => void
}

export function TeamCapacityPanel({ members, isLoading = false, hasError = false, onRetry }: TeamCapacityPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-lg p-6 text-red-200">
        <p className="font-semibold mb-3">Error loading team capacity</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded transition-colors text-sm font-medium"
            aria-label="Retry loading team capacity"
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  if (!members || members.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 text-center text-slate-400">
        No team members assigned
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-100">Team Capacity</h3>
      {members.map((member) => {
        const utilizationPercent = Math.round((member.assignedTasks / member.capacity) * 100)
        const isOverCapacity = utilizationPercent > 100

        return (
          <div key={member.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-slate-200">{member.name}</p>
                <p className="text-xs text-slate-500">
                  {member.completedTasks} completed • {member.assignedTasks} assigned
                </p>
              </div>
              <span
                className={`text-sm font-semibold px-2 py-1 rounded ${
                  isOverCapacity
                    ? 'bg-red-900/30 text-red-300'
                    : utilizationPercent > 75
                      ? 'bg-orange-900/30 text-orange-300'
                      : 'bg-green-900/30 text-green-300'
                }`}
              >
                {utilizationPercent}%
              </span>
            </div>

            {/* Capacity bar */}
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverCapacity ? 'bg-red-500' : utilizationPercent > 75 ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                role="progressbar"
                aria-valuenow={utilizationPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${member.name} capacity at ${utilizationPercent}%`}
              ></div>
            </div>

            {isOverCapacity && <p className="text-xs text-red-400 mt-2">Over capacity</p>}
          </div>
        )
      })}
    </div>
  )
}
