/**
 * AgentStatusPanel Integration Example
 *
 * This example demonstrates how to use the AgentStatusPanel component
 * to display real-time agent availability and status information in a dashboard.
 *
 * Features:
 * - Real-time status polling (10s interval)
 * - Automatic refetch on window focus
 * - Graceful error handling
 * - Loading and empty states
 * - Responsive layout
 */

import { useState } from 'react'
import { AgentStatusPanel } from '../components/AgentStatusPanel'

/**
 * Example Dashboard integrating AgentStatusPanel
 * Shows how to:
 * - Display single agent status
 * - Handle agent selection
 * - Customize polling interval
 * - Display multiple agent statuses
 */
export function AgentStatusPanelExample() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent-sr-dev')

  // Example agent list for selection
  const agents = [
    { id: 'agent-sr-dev', name: 'Senior Dev Agent' },
    { id: 'agent-junior', name: 'Junior Dev Agent' },
    { id: 'agent-pm', name: 'Project Manager Agent' },
  ]

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Agent Status Monitor</h1>
          <p className="text-slate-400">Real-time availability and task allocation tracking</p>
        </div>

        {/* Agent Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Select an agent to monitor:
          </label>
          <div className="flex flex-wrap gap-3">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedAgentId === agent.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {agent.name}
              </button>
            ))}
          </div>
        </div>

        {/* Agent Status Panel */}
        <AgentStatusPanel
          agentId={selectedAgentId}
          refetchInterval={10 * 1000} // 10 seconds
        />

        {/* Info Section */}
        <div className="mt-12 bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">How it Works</h2>
          <ul className="space-y-3 text-slate-300 text-sm">
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">1.</span>
              <span>Status updates are fetched every 10 seconds automatically</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">2.</span>
              <span>Data is refreshed when you return to the browser window</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">3.</span>
              <span>Status includes current availability and task allocation info</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">4.</span>
              <span>Capabilities show what this agent is equipped to handle</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">5.</span>
              <span>Error rates help identify agents that might need attention</span>
            </li>
          </ul>
        </div>

        {/* Implementation Notes */}
        <div className="mt-8 bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Implementation Notes</h2>
          <pre className="bg-slate-900 rounded p-4 overflow-x-auto text-sm text-slate-300">
            {`import { AgentStatusPanel } from '@/components/AgentStatusPanel'

// Basic usage
<AgentStatusPanel agentId="agent-sr-dev" />

// Custom polling interval (15 seconds)
<AgentStatusPanel
  agentId="agent-sr-dev"
  refetchInterval={15 * 1000}
/>

// Hook usage for custom implementations
const { data, isLoading, error } = useAgentStatus('agent-sr-dev')`}
          </pre>
        </div>
      </div>
    </div>
  )
}
