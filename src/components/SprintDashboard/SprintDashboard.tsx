import { useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useSprint } from '../../hooks/useSprint'
import { SprintSelector } from './SprintSelector'
import { SprintOverview } from './SprintOverview'
import { BurndownChart, type BurndownDataPoint } from './BurndownChart'
import { TeamCapacityPanel, type TeamMember } from './TeamCapacityPanel'
import { DashboardSkeleton } from '../Skeletons'

interface SprintDashboardProps {
  sprintId?: string
  sprints?: Array<{ id: string; name: string; status: string }>
}

/**
 * Main Sprint Management Dashboard component.
 * Displays sprint overview, burndown chart, and team capacity.
 * Supports URL-driven sprint selection via ?sprintId= query param.
 */
export function SprintDashboard({ sprintId: initialSprintId, sprints = [] }: SprintDashboardProps) {
  const router = useRouter()
  const [selectedSprintId, setSelectedSprintId] = useState(initialSprintId)
  const [retryBurndown, setRetryBurndown] = useState(false)
  const [retryCapacity, setRetryCapacity] = useState(false)

  const { data, isLoading, error } = useSprint(selectedSprintId || '')

  // Sync selected sprint with URL changes
  useEffect(() => {
    if (initialSprintId && initialSprintId !== selectedSprintId) {
      setSelectedSprintId(initialSprintId)
    }
  }, [initialSprintId])

  // Handle sprint selection from dropdown
  const handleSprintSelect = (sprintId: string) => {
    setSelectedSprintId(sprintId)
    setRetryBurndown(false)
    setRetryCapacity(false)
    router.navigate({
      to: '/dashboard',
      search: { sprintId },
      replace: true,
    })
  }

  // Error state with no data
  if (error && !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Sprint Dashboard</h1>
        <div className="bg-red-900 border border-red-700 rounded-lg p-6 text-red-200">
          <p className="font-semibold mb-2">Error loading sprint dashboard</p>
          <p className="text-sm mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded transition-colors font-medium text-sm"
            aria-label="Retry loading dashboard"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // No sprint selected
  if (!selectedSprintId || !data) {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Sprint Dashboard</h1>
          <DashboardSkeleton />
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Sprint Dashboard</h1>
        <SprintSelector sprints={sprints} isLoading={isLoading} />
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center text-slate-400">
          <p className="text-lg mb-2">No sprint selected</p>
          <p className="text-sm">Choose a sprint from the dropdown to view details</p>
        </div>
      </div>
    )
  }

  const { sprint, summary, burndownData, teamCapacity } = data

  // Mock burndown data if not provided
  const mockBurndown: BurndownDataPoint[] = burndownData || [
    { day: 1, plannedTasks: 20, completedTasks: 2 },
    { day: 2, plannedTasks: 18, completedTasks: 5 },
    { day: 3, plannedTasks: 15, completedTasks: 8 },
    { day: 4, plannedTasks: 12, completedTasks: 11 },
    { day: 5, plannedTasks: 10, completedTasks: 14 },
  ]

  // Mock team capacity if not provided
  const mockTeamCapacity: TeamMember[] = teamCapacity || [
    { id: '1', name: 'Alice', assignedTasks: 4, completedTasks: 2, capacity: 5 },
    { id: '2', name: 'Bob', assignedTasks: 3, completedTasks: 1, capacity: 5 },
    { id: '3', name: 'Charlie', assignedTasks: 2, completedTasks: 1, capacity: 4 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Sprint Dashboard</h1>
        <p className="text-slate-400">Manage and monitor sprint progress in real-time</p>
      </div>

      {/* Sprint Selector */}
      <SprintSelector sprints={sprints} currentSprintId={selectedSprintId} />

      {/* Sprint Info Card */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">{sprint.name}</h2>
            <p className="text-slate-400 text-sm">{sprint.goals}</p>
          </div>
          <div className="flex gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                sprint.status === 'active'
                  ? 'bg-blue-600 text-white'
                  : sprint.status === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-600 text-white'
              }`}
            >
              {sprint.status.charAt(0).toUpperCase() + sprint.status.slice(1)}
            </span>
            {isLoading && (
              <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-xs font-medium animate-pulse">
                Updating...
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">Progress</span>
            <span className="font-semibold text-blue-400">{summary.completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600"
              style={{ width: `${summary.completionPercentage}%` }}
              role="progressbar"
              aria-valuenow={summary.completionPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Sprint progress ${summary.completionPercentage}%`}
            ></div>
          </div>
          <p className="text-xs text-slate-400">
            {summary.completedTasks} of {summary.totalTasks} tasks completed
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <SprintOverview
        totalTasks={summary.totalTasks}
        completedTasks={summary.completedTasks}
        inProgressTasks={summary.inProgressTasks}
        blockedTasks={summary.blockedTasks || 0}
        isLoading={isLoading}
      />

      {/* Two Column Layout: Burndown and Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Burndown Chart - 2 columns on large screens */}
        <div className="lg:col-span-2">
          <BurndownChart
            data={mockBurndown}
            isLoading={isLoading}
            hasError={retryBurndown ? error !== null : false}
            onRetry={() => setRetryBurndown(true)}
          />
        </div>

        {/* Team Capacity Panel - 1 column on large screens */}
        <div>
          <TeamCapacityPanel
            members={mockTeamCapacity}
            isLoading={isLoading}
            hasError={retryCapacity ? error !== null : false}
            onRetry={() => setRetryCapacity(true)}
          />
        </div>
      </div>
    </div>
  )
}
