interface AgentWorkload {
  agent: string
  taskCount: number
  completedCount: number
}

interface AgentWorkloadChartProps {
  workload: AgentWorkload[]
}

/**
 * Simple bar chart style visualization of agent workload.
 * Shows tasks assigned and completed for each agent.
 */
export function AgentWorkloadChart({ workload }: AgentWorkloadChartProps) {
  if (workload.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Agent Workload</h3>
        <p className="text-slate-400 text-sm">No agents assigned to tasks</p>
      </div>
    )
  }

  const maxTasks = Math.max(...workload.map((w) => w.taskCount), 1)

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-semibold mb-4">Agent Workload</h3>

      <div className="space-y-4">
        {workload.map((agent) => {
          const completionPercentage = agent.taskCount > 0 ? (agent.completedCount / agent.taskCount) * 100 : 0
          const barWidth = (agent.taskCount / maxTasks) * 100

          return (
            <div key={agent.agent}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{agent.agent}</span>
                <span className="text-xs text-slate-400">
                  {agent.completedCount}/{agent.taskCount}
                </span>
              </div>

              {/* Main workload bar */}
              <div className="bg-slate-700 rounded h-2 overflow-hidden mb-1">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              {/* Completion progress bar */}
              <div className="bg-slate-700 rounded h-1 overflow-hidden">
                <div
                  className="bg-green-500 h-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span>Assigned Tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span>Completed</span>
        </div>
      </div>
    </div>
  )
}
