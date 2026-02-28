import { createFileRoute } from '@tanstack/react-router'
import { useAgents } from '../hooks/useAgents'
import { AgentList } from '../components/AgentList'

export const Route = createFileRoute('/agents')({
  component: AgentsPage,
})

function AgentsPage() {
  const { data: agents = [], isLoading, refetch } = useAgents()

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Agent Dashboard</h1>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <AgentList agents={agents} isLoading={isLoading} />
      </div>
    </main>
  )
}
