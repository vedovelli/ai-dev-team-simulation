import { createFileRoute } from '@tanstack/react-router'
import { DashboardLayout } from '../../pages/dashboard/DashboardLayout'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardLayout,
})
