import { createFileRoute } from '@tanstack/react-router'
import { SprintDashboard } from '../components/SprintDashboard'

// Define search params for URL-driven navigation
const dashboardSearchParams = {
  sprintId: (sprintId?: string) => sprintId || undefined,
}

export const Route = createFileRoute('/dashboard')({
  validateSearch: (search: Record<string, any>) => ({
    sprintId: search?.sprintId as string | undefined,
  }),
  component: DashboardPage,
})

function DashboardPage() {
  const { sprintId } = Route.useSearch()

  // Mock sprints data - in real app would come from API
  const mockSprints = [
    { id: 'sprint-1', name: 'Sprint 1 - Foundation', status: 'completed' },
    { id: 'sprint-2', name: 'Sprint 2 - Core Features', status: 'active' },
    { id: 'sprint-3', name: 'Sprint 3 - Polish', status: 'todo' },
  ]

  return <SprintDashboard sprintId={sprintId} sprints={mockSprints} />
}
