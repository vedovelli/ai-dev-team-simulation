import { createFileRoute } from '@tanstack/react-router'
import { WorkloadDashboardPage } from '../pages/dashboard/WorkloadDashboard'

export const Route = createFileRoute('/dashboard/workload')({
  component: () => <WorkloadDashboardPage />,
})
