import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AgentAnalytics } from '../../../components/AgentAnalytics/AgentAnalytics'

export const Route = createFileRoute('/agents/$id/analytics')({
  component: AgentAnalyticsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    sprint: search.sprint as string | undefined,
    status: search.status as string | undefined,
  }),
})

function AgentAnalyticsPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate({ to: '/agents/$id', params: { id } })}
          className="mb-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm font-medium"
        >
          ← Back to Agent
        </button>

        <AgentAnalytics agentId={id} />
      </div>
    </div>
  )
}
