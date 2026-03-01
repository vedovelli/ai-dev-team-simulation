import { createFileRoute, useParams, Link } from '@tanstack/react-router'
import { useAgents } from '../hooks/useAgents'
import { useAgentHistory } from '../hooks/useAgentHistory'
import { AgentDetailLayout } from '../components/AgentDetailLayout'

export const Route = createFileRoute('/agents/$agentId')({
  component: AgentDetailPage,
})

function AgentDetailPage() {
  const { agentId } = useParams({ from: Route.fullPath })
  const { data: agents = [], isLoading: isAgentsLoading } = useAgents()
  const { data: history = [], isLoading: isHistoryLoading } = useAgentHistory(agentId)

  const agent = agents.find((a) => a.id === agentId)

  if (!isAgentsLoading && !agent) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/agents"
            className="text-blue-600 hover:text-blue-700 mb-6 inline-block"
          >
            ← Back to Agents
          </Link>
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Agent Not Found
            </h1>
            <p className="text-slate-600 mb-6">
              The agent with ID "{agentId}" could not be found.
            </p>
            <Link
              to="/agents"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Agents
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/agents"
          className="text-blue-600 hover:text-blue-700 mb-6 inline-block"
        >
          ← Back to Agents
        </Link>

        {agent && (
          <AgentDetailLayout
            agent={agent}
            history={history}
            isLoading={isAgentsLoading}
            isHistoryLoading={isHistoryLoading}
          />
        )}
      </div>
    </main>
  )
}
