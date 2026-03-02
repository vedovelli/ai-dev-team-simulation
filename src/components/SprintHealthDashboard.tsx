import { useSprintMetrics } from '../hooks/useSprintMetrics'
import { BurndownChart } from './BurndownChart'

interface SprintHealthDashboardProps {
  sprintId: string
}

export function SprintHealthDashboard({ sprintId }: SprintHealthDashboardProps) {
  const { data, isLoading, error } = useSprintMetrics(sprintId)

  if (error) {
    return (
      <div className="p-6 bg-red-900 border border-red-700 rounded-lg text-red-200">
        Error: {error.message}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-400">Loading sprint health...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-400">No sprint data available</p>
      </div>
    )
  }

  const { sprint, metrics, burndownData } = data

  return (
    <div className="space-y-6">
      {/* Sprint Header */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h1 className="text-3xl font-bold mb-2">{sprint.name}</h1>
        <p className="text-slate-400 mb-4">{sprint.goals}</p>
        <div className="flex gap-4 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${metrics.onTrack ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            {metrics.onTrack ? '✓ On Track' : '⚠ Off Track'}
          </span>
          <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
            {metrics.completionPercentage}% Complete
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Points */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-400 mb-2">Total Points</p>
          <p className="text-3xl font-bold">{metrics.totalPoints}</p>
        </div>

        {/* Completed Points */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-400 mb-2">Completed Points</p>
          <p className="text-3xl font-bold text-green-400">{metrics.completedPoints}</p>
          <p className="text-xs text-slate-500 mt-2">Velocity</p>
        </div>

        {/* Remaining Points */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-400 mb-2">Remaining Points</p>
          <p className="text-3xl font-bold text-orange-400">{metrics.remainingPoints}</p>
        </div>

        {/* Days Remaining */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-400 mb-2">Days Remaining</p>
          <p className="text-3xl font-bold">{metrics.daysRemaining}</p>
          <p className="text-xs text-slate-500 mt-2">of {metrics.sprintDuration} days</p>
        </div>
      </div>

      {/* Burndown Chart */}
      <BurndownChart data={burndownData} totalPoints={metrics.totalPoints} />

      {/* Progress Bar */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Overall Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Story Points</span>
              <span className="text-sm font-medium">
                {metrics.completedPoints} / {metrics.totalPoints}
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${metrics.completionPercentage >= 90 ? 'bg-green-500' : metrics.completionPercentage >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                style={{ width: `${metrics.completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
