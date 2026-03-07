import { useSprint } from '../hooks/useSprint'
import { StatsCard } from './StatsCard'
import { TaskStatusList } from './TaskStatusList'
import { AgentWorkloadChart } from './AgentWorkloadChart'

interface SprintDashboardProps {
  sprintId: string
}

/**
 * Main Sprint Management Dashboard component.
 * Displays sprint overview stats, task distribution, and agent workload visualization.
 */
export function SprintDashboard({ sprintId }: SprintDashboardProps) {
  const { data, isLoading, error } = useSprint(sprintId)

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-red-900 border border-red-700 rounded-lg text-red-200">
        <p className="font-semibold mb-1">Error loading sprint dashboard</p>
        <p className="text-sm">{error.message}</p>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-400">Loading sprint dashboard...</p>
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

  const { sprint, summary, tasksByStatus, agentWorkload } = data

  return (
    <div className="space-y-6">
      {/* Sprint Header */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h1 className="text-3xl font-bold mb-2">{sprint.name}</h1>
        <p className="text-slate-400 mb-4">{sprint.goals}</p>
        <div className="flex gap-4 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            sprint.status === 'active' ? 'bg-blue-600 text-white' : sprint.status === 'completed' ? 'bg-green-600 text-white' : 'bg-slate-600 text-white'
          }`}>
            {sprint.status.charAt(0).toUpperCase() + sprint.status.slice(1)}
          </span>
          <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm font-medium">
            {summary.completionPercentage}% Complete
          </span>
        </div>
      </div>

      {/* Basic Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Tasks"
          value={summary.totalTasks}
        />
        <StatsCard
          label="Completed"
          value={summary.completedTasks}
          variant="success"
        />
        <StatsCard
          label="In Progress"
          value={summary.inProgressTasks}
          variant="info"
        />
        <StatsCard
          label="Remaining"
          value={summary.remainingTasks}
          variant="warning"
        />
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Overall Progress</h3>
        <div className="space-y-2">
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600"
              style={{ width: `${summary.completionPercentage}%` }}
            />
          </div>
          <p className="text-sm text-slate-400">{summary.completedTasks} of {summary.totalTasks} tasks completed</p>
        </div>
      </div>

      {/* Two Column Layout: Task Status Lists and Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Status Lists - Takes 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Task Distribution</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TaskStatusList status="backlog" tasks={tasksByStatus.backlog} />
            <TaskStatusList status="in-progress" tasks={tasksByStatus['in-progress']} />
            <TaskStatusList status="in-review" tasks={tasksByStatus['in-review']} />
            <TaskStatusList status="done" tasks={tasksByStatus.done} />
          </div>
        </div>

        {/* Agent Workload - Takes 1 column on large screens */}
        <div>
          <AgentWorkloadChart workload={agentWorkload} />
        </div>
      </div>
    </div>
  )
}
