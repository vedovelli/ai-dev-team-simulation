/**
 * MSW Handlers for Agent Performance Analytics
 *
 * Mock API endpoints for agent analytics data:
 * - Aggregate performance metrics across time ranges
 * - Time-series trend data for multiple metrics
 * - Single agent analytics views
 */

import { http, HttpResponse } from 'msw'
import type { AgentAnalyticsData } from '../../hooks/useAgentAnalytics'
import type { AgentMetrics, TimeSeriesDataPoint } from '../../types/metrics'

/**
 * Generate realistic agent metrics
 */
function generateAgentMetrics(count = 5): AgentMetrics[] {
  const agents = [
    { id: 'agent-1', name: 'Claude Analysis', role: 'Analyst' },
    { id: 'agent-2', name: 'Code Bot', role: 'Developer' },
    { id: 'agent-3', name: 'QA Validator', role: 'Tester' },
    { id: 'agent-4', name: 'Doc Generator', role: 'Writer' },
    { id: 'agent-5', name: 'Integration Agent', role: 'Integrator' },
  ].slice(0, count)

  return agents.map((agent) => {
    const completedTasks = 50 + Math.floor(Math.random() * 150)
    const totalTasks = completedTasks + Math.floor(Math.random() * 30)
    const failedTasks = Math.floor(Math.random() * 10)

    const completionRate = Math.round(
      ((totalTasks - failedTasks) / totalTasks) * 100
    )
    const errorRate = Math.round((failedTasks / totalTasks) * 100)

    let performanceTier: AgentMetrics['performanceTier']
    if (completionRate >= 95) performanceTier = 'excellent'
    else if (completionRate >= 85) performanceTier = 'good'
    else if (completionRate >= 70) performanceTier = 'average'
    else performanceTier = 'below-average'

    return {
      agentId: agent.id,
      agentName: agent.name,
      agentRole: agent.role,
      totalTasks,
      completedTasks,
      failedTasks,
      inProgressTasks: Math.floor(Math.random() * 5),
      completionRate,
      averageTimeToComplete: 15 + Math.floor(Math.random() * 120),
      errorRate,
      performanceTier,
      successRate: completionRate,
      lastActivityAt: new Date(
        Date.now() - Math.random() * 60 * 60 * 1000
      ).toISOString(),
    }
  })
}

/**
 * Generate time-series trend data for a date range
 */
function generateTrendData(days: number): TimeSeriesDataPoint[] {
  const now = new Date()
  const dataPoints: TimeSeriesDataPoint[] = []
  const metrics = ['tasks_completed', 'success_rate', 'avg_completion_time']

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    metrics.forEach((metric) => {
      let value = 0
      if (metric === 'tasks_completed') {
        value = 40 + Math.floor(Math.random() * 60)
      } else if (metric === 'success_rate') {
        value = 75 + Math.floor(Math.random() * 20)
      } else {
        value = 30 + Math.floor(Math.random() * 60)
      }

      dataPoints.push({
        timestamp: date.toISOString(),
        value,
        metric,
        granularity: 'daily',
      })
    })
  }

  return dataPoints
}

export const agentAnalyticsHandlers = [
  /**
   * GET /api/agents/analytics
   * Get analytics for all agents with time-range filtering
   * Query params: timeRange (7d|30d|90d)
   */
  http.get('/api/agents/analytics', ({ request }) => {
    const url = new URL(request.url)
    const timeRange = url.searchParams.get('timeRange') || '7d'

    const days =
      timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90

    const metrics = generateAgentMetrics(5)
    const trendData = generateTrendData(days)

    const response: AgentAnalyticsData = {
      metrics,
      trendData,
      timeRange: timeRange as '7d' | '30d' | '90d',
    }

    return HttpResponse.json(response, { status: 200 })
  }),

  /**
   * GET /api/agents/:id/analytics
   * Get analytics for a single agent
   * Query params: timeRange (7d|30d|90d)
   */
  http.get('/api/agents/:id/analytics', ({ params, request }) => {
    const { id } = params
    const url = new URL(request.url)
    const timeRange = url.searchParams.get('timeRange') || '7d'

    const days =
      timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90

    const allMetrics = generateAgentMetrics(5)
    const metrics = allMetrics.filter((m) => m.agentId === id)

    if (metrics.length === 0) {
      return HttpResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    const trendData = generateTrendData(days)

    const response: AgentAnalyticsData = {
      metrics,
      trendData,
      timeRange: timeRange as '7d' | '30d' | '90d',
    }

    return HttpResponse.json(response, { status: 200 })
  }),
]
