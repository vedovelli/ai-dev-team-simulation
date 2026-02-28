import { useAgents } from '../../hooks/useAgents'
import { AgentCard } from '../../components/AgentCard'

export function AgentsDashboard() {
  const { data: response, isLoading, error } = useAgents()
  const agents = response?.data ?? []

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Agent Dashboard</h1>
        <div className="flex items-center justify-center py-16">
          <p className="text-slate-500">Loading agents...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Agent Dashboard</h1>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Error loading agents: {error.message}
        </div>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Agent Dashboard</h1>
        <div className="flex items-center justify-center py-16">
          <p className="text-slate-500">No agents available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Agent Dashboard</h1>
        <p className="text-slate-600 mb-8">Manage and monitor your team agents</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default AgentsDashboard
