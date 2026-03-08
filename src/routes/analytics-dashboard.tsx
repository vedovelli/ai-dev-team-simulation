import { createFileRoute } from '@tanstack/react-router'
import { AnalyticsDashboard } from '../components/AnalyticsDashboard'

/**
 * Analytics Dashboard Route
 * Displays comprehensive analytics including:
 * - Agent performance trends
 * - Sprint velocity metrics
 * - Task distribution with virtualized table
 */

export const Route = createFileRoute('/analytics-dashboard')({
  component: AnalyticsDashboardPage,
})

function AnalyticsDashboardPage() {
  return <AnalyticsDashboard />
}
