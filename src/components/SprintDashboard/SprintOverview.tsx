import { StatsCard } from '../StatsCard'
import { MetricCardSkeleton } from '../Skeletons'

interface SprintOverviewProps {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  blockedTasks: number
  isLoading?: boolean
}

export function SprintOverview({
  totalTasks,
  completedTasks,
  inProgressTasks,
  blockedTasks,
  isLoading = false,
}: SprintOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard label="Total Tasks" value={totalTasks} />
      <StatsCard label="Completed" value={completedTasks} variant="success" />
      <StatsCard label="In Progress" value={inProgressTasks} variant="info" />
      <StatsCard label="Blocked" value={blockedTasks} variant="danger" />
    </div>
  )
}
