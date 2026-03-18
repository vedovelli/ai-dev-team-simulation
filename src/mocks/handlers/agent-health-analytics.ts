/**
 * MSW Handlers for Agent Health & Workload Analytics (FAB-345)
 *
 * Mock API endpoints for agent analytics data:
 * - GET /api/agents/team/health-analytics - Team overview
 * - GET /api/agents/:id/health-analytics - Single agent analytics
 */

import { http, HttpResponse } from 'msw'
import type {
  AgentAnalytics,
  TeamAnalytics,
  PerformanceTrendPoint,
} from '../../types/agent-analytics'

/**
 * Mock agent data with realistic variations
 */
const mockAgents = [
  {
    id: 'agent-1',
    name: 'Claude Analysis',
    baseUtilization: 75,
    baseCompletionRate: 92,
  },
  {
    id: 'agent-2',
    name: 'Code Bot',
    baseUtilization: 85,
    baseCompletionRate: 88,
  },
  {
    id: 'agent-3',
    name: 'QA Validator',
    baseUtilization: 70,
    baseCompletionRate: 95,
  },
  {
    id: 'agent-4',
    name: 'Doc Generator',
    baseUtilization: 60,
    baseCompletionRate: 90,
  },
  {
    id: 'agent-5',
    name: 'Integration Agent',
    baseUtilization: 80,
    baseCompletionRate: 87,
  },
]

/**
 * Generate realistic trend data with variance
 */
function generateTrendData(days = 7): PerformanceTrendPoint[] {
  const trends: PerformanceTrendPoint[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Add realistic variance to velocity (3-8 tasks per day)
    const baseVelocity = 5
    const velocity = baseVelocity + (Math.random() - 0.5) * 4

    // Burndown forecast decreases over time with some variance
    const daysRemaining = Math.max(1, days - i)
    const baseBurndown = Math.max(5, 30 - daysRemaining * 3)
    const burndownForecast = baseBurndown + (Math.random() - 0.5) * 5

    trends.push({
      timestamp: date.toISOString(),
      velocity: Math.max(0, Math.round(velocity * 10) / 10),
      burndownForecast: Math.max(0, Math.round(burndownForecast * 10) / 10),
    })
  }

  return trends
}

/**
 * Generate single agent analytics with realistic variance
 */
function generateAgentAnalytics(
  agentId: string,
  agentName: string
): AgentAnalytics {
  const agent = mockAgents.find((a) => a.id === agentId)
  if (!agent) {
    throw new Error(`Agent ${agentId} not found`)
  }

  // Add variance to metrics (±10%)
  const utilizationVariance = (Math.random() - 0.5) * 20
  const completionVariance = (Math.random() - 0.5) * 15

  const utilization = Math.max(
    0,
    Math.min(100, agent.baseUtilization + utilizationVariance)
  )
  const completionRate = Math.max(
    0,
    Math.min(100, agent.baseCompletionRate + completionVariance)
  )

  const capacityLimit = 10
  const tasksAssigned = Math.round((utilization / 100) * capacityLimit)

  return {
    agentId,
    agentName,
    workload: {
      tasksAssigned,
      capacityLimit,
      utilizationPercent: Math.round(utilization),
    },
    performance: {
      completionRate: Math.round(completionRate),
      avgTaskDuration: 6 + Math.random() * 4, // 6-10 hours
      successRatio: Math.round(completionRate * 0.98 + Math.random() * 2),
    },
    trends: generateTrendData(7),
    lastUpdated: new Date().toISOString(),
  }
}

export const agentHealthAnalyticsHandlers = [
  /**
   * GET /api/agents/team/health-analytics
   * Get team-wide workload and performance analytics
   */
  http.get('/api/agents/team/health-analytics', () => {
    const agents = mockAgents.map((agent) =>
      generateAgentAnalytics(agent.id, agent.name)
    )

    // Calculate team aggregates
    const totalUtilization = agents.reduce(
      (sum, a) => sum + a.workload.utilizationPercent,
      0
    )
    const teamAverageUtilization = Math.round(totalUtilization / agents.length)

    const teamVelocity =
      agents.reduce((sum, a) => {
        const lastTrend = a.trends[a.trends.length - 1]
        return sum + (lastTrend?.velocity ?? 0)
      }, 0) / agents.length

    // Calculate projected burndown as average across all agents
    const projectedBurndown =
      agents.reduce((sum, a) => {
        const lastTrend = a.trends[a.trends.length - 1]
        return sum + (lastTrend?.burndownForecast ?? 0)
      }, 0) / agents.length

    const response: TeamAnalytics = {
      agents,
      workloadDistribution: agents.map((a) => ({
        agentId: a.agentId,
        agentName: a.agentName,
        tasksAssigned: a.workload.tasksAssigned,
        capacityLimit: a.workload.capacityLimit,
        utilizationPercent: a.workload.utilizationPercent,
      })),
      teamAverageUtilization,
      teamVelocity: Math.round(teamVelocity * 10) / 10,
      projectedBurndown: Math.round(projectedBurndown * 10) / 10,
      lastUpdated: new Date().toISOString(),
    }

    return HttpResponse.json(response, { status: 200 })
  }),

  /**
   * GET /api/agents/:id/health-analytics
   * Get analytics for a single agent
   */
  http.get('/api/agents/:id/health-analytics', ({ params }) => {
    const { id } = params as { id: string }

    const agent = mockAgents.find((a) => a.id === id)
    if (!agent) {
      return HttpResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    const response = generateAgentAnalytics(id, agent.name)
    return HttpResponse.json(response, { status: 200 })
  }),
]
