import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useAgentHistory } from '../../hooks/useAgentHistory'

export const Route = createFileRoute('/agents/$id')({
  component: AgentDetail,
})

function AgentDetail() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { data: agentDetail, isLoading, error } = useAgentHistory(id)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate({ to: '/agents' })}
            className="mb-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            ← Back to Agents
          </button>
          <div className="flex items-center justify-center py-16">
            <p className="text-slate-400">Loading agent details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate({ to: '/agents' })}
            className="mb-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            ← Back to Agents
          </button>
          <div className="p-6 bg-red-900 border border-red-700 rounded-lg text-red-200">
            Error: {error.message}
          </div>
        </div>
      </div>
    )
  }

  if (!agentDetail) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate({ to: '/agents' })}
            className="mb-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            ← Back to Agents
          </button>
          <div className="flex items-center justify-center py-16">
            <p className="text-slate-400">Agent not found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate({ to: '/agents' })}
          className="mb-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        >
          ← Back to Agents
        </button>

        {/* Agent Profile Header */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{agentDetail.name}</h1>
              <div className="flex gap-4 items-center">
                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
                  {agentDetail.role}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  agentDetail.status === 'working' ? 'bg-green-600' :
                  agentDetail.status === 'idle' ? 'bg-yellow-600' :
                  agentDetail.status === 'blocked' ? 'bg-red-600' :
                  'bg-slate-600'
                }`}>
                  {agentDetail.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold">Activity History</h2>
            <p className="text-slate-400 mt-1">Recent tasks and decisions ({agentDetail.history.length} entries)</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700 border-b border-slate-600">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Timestamp</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Status</th>
                </tr>
              </thead>
              <tbody>
                {agentDetail.history.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{entry.title}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-xs font-medium">
                        {entry.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">{entry.description}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(entry.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        entry.metadata?.status === 'success' ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'
                      }`}>
                        {String(entry.metadata?.status ?? 'pending')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {agentDetail.history.length === 0 && (
            <div className="px-6 py-8 text-center text-slate-400">
              <p>No history entries available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
