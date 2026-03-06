/**
 * MSW Handlers for Agent Performance Metrics
 *
 * Mock API endpoints for metrics data used in the Agent Performance Dashboard.
 * Provides realistic mock data for:
 * - Performance summary (aggregated stats)
 * - Time-series data (hourly/daily granularity)
 * - Per-agent performance breakdown
 */

import { http, HttpResponse } from 'msw'
import type {
  PerformanceSummary,
  TimeSeriesDataPoint,
  AgentMetrics,
} from '../../types/metrics'

/**
 * Generate mock agent performance metrics
 */
function generateAgentMetrics(): AgentMetrics[] {
  const agents = [
    { id: 'agent-1', name: 'Claude Analysis', role: 'Analyst' },
    { id: 'agent-2', name: 'Code Bot', role: 'Developer' },
    { id: 'agent-3', name: 'QA Validator', role: 'Tester' },
    { id: 'agent-4', name: 'Doc Generator', role: 'Writer' },
    { id: 'agent-5', name: 'Integration Agent', role: 'Integrator' },
  ]

  return agents.map((agent, index) => {
    const completedTasks = 50 + Math.floor(Math.random() * 150)
    const totalTasks = completedTasks + Math.floor(Math.random() * 30)
    const failedTasks = Math.floor(Math.random() * 10)

    const completionRate = Math.round(
      ((totalTasks - failedTasks) / totalTasks) * 100
    )
    const errorRate = Math.round((failedTasks / totalTasks) * 100)

    // Determine performance tier based on completion rate
    let performanceTier: AgentMetrics['performanceTier']
    if (completionRate >= 95)
      performanceTier = 'excellent'
    else if (completionRate >= 85)
      performanceTier = 'good'
    else if (completionRate >= 70)
      performanceTier = 'average'
    else
      performanceTier = 'below-average'

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
 * Generate mock time-series data
 */
function generateTimeSeriesData(): TimeSeriesDataPoint[] {
  const now = new Date()
  const dataPoints: TimeSeriesDataPoint[] = []

  // Generate 24 hourly data points
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now)
    timestamp.setHours(timestamp.getHours() - (24 - i))

    dataPoints.push({
      timestamp: timestamp.toISOString(),
      value: 70 + Math.floor(Math.random() * 30),
      metric: 'completion_rate',
      granularity: 'hourly',
    })
  }

  // Generate 7 daily data points
  for (let i = 0; i < 7; i++) {
    const timestamp = new Date(now)
    timestamp.setDate(timestamp.getDate() - (7 - i))
    timestamp.setHours(0, 0, 0, 0)

    dataPoints.push({
      timestamp: timestamp.toISOString(),
      value: 72 + Math.floor(Math.random() * 25),
      metric: 'daily_completion_rate',
      granularity: 'daily',
    })
  }

  return dataPoints
}

/**
 * Generate mock performance summary
 */
function generatePerformanceSummary(): PerformanceSummary {
  const agentMetrics = generateAgentMetrics()

  const totalTasks = agentMetrics.reduce((sum, a) => sum + a.totalTasks, 0)
  const completedTasks = agentMetrics.reduce(
    (sum, a) => sum + a.completedTasks,
    0
  )
  const failedTasks = agentMetrics.reduce((sum, a) => sum + a.failedTasks, 0)
  const activeAgents = agentMetrics.filter(
    (a) => a.inProgressTasks > 0 || a.lastActivityAt
  ).length

  const totalCompletionTime = agentMetrics.reduce(
    (sum, a) => sum + a.averageTimeToComplete,
    0
  )
  const averageCompletionTime = Math.round(
    totalCompletionTime / agentMetrics.length
  )

  const overallCompletionRate = Math.round(
    ((totalTasks - failedTasks) / totalTasks) * 100
  )
  const overallErrorRate = Math.round((failedTasks / totalTasks) * 100)

  // System health score based on completion rate and active agents
  const systemHealthScore = Math.round(
    (overallCompletionRate * 0.7 + (activeAgents / agentMetrics.length) * 100 * 0.3)
  )

  return {
    totalTasks,
    completedTasks,
    failedTasks,
    activeAgents,
    averageCompletionTime,
    overallCompletionRate,
    overallErrorRate,
    systemHealthScore: Math.min(100, systemHealthScore),
    lastUpdatedAt: new Date().toISOString(),
  }
}

/**
 * MSW handlers for metrics endpoints
 */
export const metricsHandlers = [
  /**
   * GET /api/metrics/summary
   * Returns aggregated performance statistics
   */
  http.get('/api/metrics/summary', () => {
    return HttpResponse.json<PerformanceSummary>(
      generatePerformanceSummary(),
      { status: 200 }
    )
  }),

  /**
   * GET /api/metrics/timeseries
   * Returns time-series data for charts (hourly/daily granularity)
   */
  http.get('/api/metrics/timeseries', () => {
    return HttpResponse.json<TimeSeriesDataPoint[]>(
      generateTimeSeriesData(),
      { status: 200 }
    )
  }),

  /**
   * GET /api/agents/performance
   * Returns per-agent performance metrics with performance tiers
   */
  http.get('/api/agents/performance', () => {
    return HttpResponse.json<AgentMetrics[]>(generateAgentMetrics(), {
      status: 200,
    })
  }),
]
