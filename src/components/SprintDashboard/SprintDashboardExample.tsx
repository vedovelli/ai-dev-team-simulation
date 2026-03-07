import { SprintDashboard } from './SprintDashboard'

/**
 * Example component showing SprintDashboard usage with mock data.
 * Demonstrates the dashboard in different states:
 * - Sprint selection
 * - Loading states
 * - Empty states
 * - Error states
 */
export function SprintDashboardExample() {
  const mockSprints = [
    {
      id: 'sprint-1',
      name: 'Sprint 1 - Q1 Foundation',
      status: 'completed',
    },
    {
      id: 'sprint-2',
      name: 'Sprint 2 - Q1 Features',
      status: 'active',
    },
    {
      id: 'sprint-3',
      name: 'Sprint 3 - Q1 Polish',
      status: 'todo',
    },
    {
      id: 'sprint-4',
      name: 'Sprint 4 - Q2 Planning',
      status: 'todo',
    },
  ]

  return (
    <div className="p-6">
      {/* Default: No sprint selected */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Sprint Dashboard - Empty State</h2>
        <SprintDashboard sprints={mockSprints} />
      </div>

      {/* With sprint selected */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Sprint Dashboard - With Active Sprint</h2>
        <SprintDashboard sprintId="sprint-2" sprints={mockSprints} />
      </div>
    </div>
  )
}
