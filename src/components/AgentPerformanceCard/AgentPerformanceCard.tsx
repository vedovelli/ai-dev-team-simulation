import { useState } from 'react'
import type { AgentMetrics } from '../../types/metrics'
import { TaskSelectorModal } from './TaskSelectorModal'

interface AgentPerformanceCardProps {
  agent: AgentMetrics
}

/**
 * Displays per-agent KPIs with task assignment flow
 * Shows: agent name, tasks completed, velocity, on-time rate
 */
export function AgentPerformanceCard({ agent }: AgentPerformanceCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Calculate on-time rate (100% - error rate)
  const onTimeRate = 100 - agent.errorRate

  return (
    <>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-slate-600 transition-colors">
        {/* Header: Agent name and performance tier badge */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-200">{agent.agentName}</h3>
            <p className="text-xs text-slate-400 mt-1">{agent.agentRole}</p>
          </div>
          <span
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${
              agent.performanceTier === 'excellent'
                ? 'bg-green-900 text-green-200'
                : agent.performanceTier === 'good'
                  ? 'bg-blue-900 text-blue-200'
                  : agent.performanceTier === 'average'
                    ? 'bg-yellow-900 text-yellow-200'
                    : 'bg-red-900 text-red-200'
            }`}
          >
            {agent.performanceTier.replace('-', ' ')}
          </span>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Tasks Completed */}
          <div className="bg-slate-700 rounded p-3">
            <p className="text-xs text-slate-400 mb-1">Completed</p>
            <p className="text-lg font-bold text-slate-200">
              {agent.completedTasks}
              <span className="text-xs text-slate-400 font-normal ml-1">
                / {agent.totalTasks}
              </span>
            </p>
          </div>

          {/* Velocity */}
          <div className="bg-slate-700 rounded p-3">
            <p className="text-xs text-slate-400 mb-1">Velocity</p>
            <p className="text-lg font-bold text-slate-200">{Math.round(agent.completionRate)}%</p>
          </div>

          {/* Success Rate */}
          <div className="bg-slate-700 rounded p-3">
            <p className="text-xs text-slate-400 mb-1">Success Rate</p>
            <p className="text-lg font-bold text-slate-200">{agent.successRate}%</p>
          </div>

          {/* On-Time Rate */}
          <div className="bg-slate-700 rounded p-3">
            <p className="text-xs text-slate-400 mb-1">On-Time</p>
            <p className="text-lg font-bold text-slate-200">{onTimeRate}%</p>
          </div>
        </div>

        {/* Task Assignment Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
          aria-label={`Assign task to ${agent.agentName}`}
        >
          Assign Task
        </button>
      </div>

      {/* Task Selector Modal */}
      {isModalOpen && (
        <TaskSelectorModal
          agent={agent}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}
