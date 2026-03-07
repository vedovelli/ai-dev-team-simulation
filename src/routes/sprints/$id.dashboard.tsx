import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SprintDashboard } from '../../components/SprintDashboard'

export const Route = createFileRoute('/sprints/$id/dashboard')({
  component: SprintDashboardPage,
})

function SprintDashboardPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate({ to: '/sprints/' })}
          className="mb-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm font-medium"
        >
          ← Back to Sprints
        </button>

        <SprintDashboard sprintId={id} />
      </div>
    </div>
  )
}
