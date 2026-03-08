/**
 * MSW Handlers for Analytics Dashboard
 *
 * Mock API endpoints for comprehensive analytics data used in the
 * Analytics Dashboard with TanStack Virtual. Provides realistic mock data for:
 * - Dashboard summary statistics
 * - Agent utilization time-series data
 * - Sprint velocity metrics with burndown data
 * - Task distribution with pagination and filtering
 */

import { http, HttpResponse } from 'msw'
import type {
  AnalyticsDashboardData,
  AnalyticsSummary,
  AgentMetrics,
  SprintMetric,
  TimeSeriesDataPoint,
  BurndownDataPoint,
  TaskDistributionResponse,
  TaskDistributionItem,
} from '../../types/analytics'

/**
 * Generate mock analytics summary
 */
function generateAnalyticsSummary(): AnalyticsSummary {
  return {
    totalAgents: 5,
    activeAgents: 4,
    averageCompletionRate: 82,
    totalTasksCompleted: 347,
    overallVelocity: 45.8,
    avgTaskDuration: 4.2,
  }
}

/**
 * Generate mock agent metrics
 */
function generateAgentMetrics(): AgentMetrics[] {
  const agents = [
    { id: 'agent-1', name: 'Claude Analysis' },
    { id: 'agent-2', name: 'Code Bot' },
    { id: 'agent-3', name: 'QA Validator' },
    { id: 'agent-4', name: 'Doc Generator' },
    { id: 'agent-5', name: 'Integration Agent' },
  ]

  return agents.map((agent) => {
    const completedTasks = 50 + Math.floor(Math.random() * 80)
    const completionRate = 75 + Math.floor(Math.random() * 25)
    const performanceTiers: Array<'excellent' | 'good' | 'average' | 'needs_improvement'> = [
      'excellent',
      'good',
      'average',
      'needs_improvement',
    ]

    return {
      agentId: agent.id,
      agentName: agent.name,
      completedTasks,
      completionRate,
      averageDuration: 2 + Math.floor(Math.random() * 8),
      performanceTier: performanceTiers[Math.floor(Math.random() * performanceTiers.length)],
      activeTaskCount: Math.floor(Math.random() * 5),
    }
  })
}

/**
 * Generate mock time-series agent utilization data
 */
function generateAgentUtilizationTimeSeries(days: number): TimeSeriesDataPoint[] {
  const dataPoints: TimeSeriesDataPoint[] = []
  const now = new Date()
  const agents = [
    'Claude Analysis',
    'Code Bot',
    'QA Validator',
    'Doc Generator',
    'Integration Agent',
  ]

  for (let i = 0; i < days; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - (days - i))
    date.setHours(0, 0, 0, 0)

    agents.forEach((agentName) => {
      dataPoints.push({
        timestamp: date.toISOString(),
        value: 60 + Math.floor(Math.random() * 40),
        metric: agentName,
        granularity: 'daily',
      })
    })
  }

  return dataPoints
}

/**
 * Generate mock sprint velocity data with burndown
 */
function generateSprintMetrics(): SprintMetric[] {
  const sprints = [
    { id: 'sprint-1', name: 'Sprint 1' },
    { id: 'sprint-2', name: 'Sprint 2' },
    { id: 'sprint-3', name: 'Sprint 3' },
  ]

  return sprints.map((sprint, index) => {
    const totalTasks = 20 + Math.floor(Math.random() * 30)
    const completedTasks = Math.floor(totalTasks * (0.5 + Math.random() * 0.5))
    const completionRate = Math.round((completedTasks / totalTasks) * 100)

    // Generate burndown data
    const burndownData: BurndownDataPoint[] = []
    const sprintStart = new Date()
    sprintStart.setDate(sprintStart.getDate() - (10 - index * 5))
    const sprintLength = 10

    for (let day = 0; day <= sprintLength; day++) {
      const date = new Date(sprintStart)
      date.setDate(date.getDate() + day)

      const idealRemaining = totalTasks - (totalTasks / sprintLength) * day
      const actualCompleted = Math.floor((completedTasks / sprintLength) * day + Math.random() * 2)

      burndownData.push({
        date: date.toISOString().split('T')[0],
        remaining: Math.max(0, totalTasks - actualCompleted),
        ideal: Math.max(0, idealRemaining),
        completed: actualCompleted,
      })
    }

    const statuses: Array<'planning' | 'active' | 'completed'> = ['planning', 'active', 'completed']

    return {
      sprintId: sprint.id,
      sprintName: sprint.name,
      completedTasks,
      totalTasks,
      completionRate,
      velocity: 35 + Math.floor(Math.random() * 40),
      burndownData,
      projectedCompletionDate: new Date(
        Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      status: statuses[index % statuses.length],
    }
  })
}

/**
 * Generate mock task distribution data
 */
function generateTaskDistributionData(
  page: number,
  pageSize: number,
  priority?: string,
  status?: string,
): TaskDistributionResponse {
  const priorities: Array<'critical' | 'high' | 'medium' | 'low'> = [
    'critical',
    'high',
    'medium',
    'low',
  ]
  const statuses: Array<'todo' | 'in_progress' | 'review' | 'completed'> = [
    'todo',
    'in_progress',
    'review',
    'completed',
  ]
  const agents = ['Claude Analysis', 'Code Bot', 'QA Validator', 'Doc Generator', 'Integration Agent']

  // Total items to generate (1000+ for virtualization testing)
  const totalItems = 1000
  const startIdx = (page - 1) * pageSize
  const endIdx = Math.min(page * pageSize, totalItems)

  const items: TaskDistributionItem[] = []

  for (let i = startIdx; i < endIdx; i++) {
    const taskPriority = priority || priorities[Math.floor(Math.random() * priorities.length)]
    const taskStatus = status || statuses[Math.floor(Math.random() * statuses.length)]
    const createdDaysAgo = Math.floor(Math.random() * 90)
    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - createdDaysAgo)

    const isCompleted = taskStatus === 'completed'
    const completedAt = isCompleted
      ? new Date(createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      : undefined
    const duration = isCompleted ? Math.floor(Math.random() * 20) + 1 : undefined

    items.push({
      id: `task-${i}`,
      title: `Task ${i} - ${['Fix bug', 'Implement feature', 'Review code', 'Write test'][i % 4]}`,
      priority: taskPriority as 'critical' | 'high' | 'medium' | 'low',
      status: taskStatus as 'todo' | 'in_progress' | 'review' | 'completed',
      agentId: `agent-${(i % 5) + 1}`,
      agentName: agents[i % agents.length],
      createdAt: createdAt.toISOString(),
      completedAt,
      duration,
    })
  }

  return {
    items,
    total: totalItems,
    page,
    pageSize,
    hasMore: endIdx < totalItems,
  }
}

/**
 * Generate full analytics dashboard data
 */
function generateAnalyticsDashboardData(
  timeRange: string,
): AnalyticsDashboardData {
  const daysMap: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    all: 365,
  }
  const days = daysMap[timeRange] || 7

  return {
    summary: generateAnalyticsSummary(),
    agentMetrics: generateAgentMetrics(),
    sprintMetrics: generateSprintMetrics(),
    agentUtilizationTimeSeries: generateAgentUtilizationTimeSeries(days),
    sprintVelocityTimeSeries: generateAgentUtilizationTimeSeries(days), // Reuse for now
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * MSW handlers for analytics endpoints
 */
export const analyticsHandlers = [
  /**
   * GET /api/analytics/overview
   * Returns complete dashboard data with all metrics
   */
  http.get('/api/analytics/overview', ({ request }) => {
    const url = new URL(request.url)
    const timeRange = url.searchParams.get('timeRange') || '7d'

    return HttpResponse.json<AnalyticsDashboardData>(
      generateAnalyticsDashboardData(timeRange),
      { status: 200 },
    )
  }),

  /**
   * GET /api/analytics/agents/utilization
   * Returns time-series agent performance data
   */
  http.get('/api/analytics/agents/utilization', ({ request }) => {
    const url = new URL(request.url)
    const timeRange = url.searchParams.get('timeRange') || '7d'

    const daysMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      all: 365,
    }
    const days = daysMap[timeRange] || 7

    return HttpResponse.json<TimeSeriesDataPoint[]>(
      generateAgentUtilizationTimeSeries(days),
      { status: 200 },
    )
  }),

  /**
   * GET /api/analytics/sprints/velocity
   * Returns sprint velocity and burndown data
   */
  http.get('/api/analytics/sprints/velocity', ({ request }) => {
    const url = new URL(request.url)
    const timeRange = url.searchParams.get('timeRange') || '7d'

    return HttpResponse.json<SprintMetric[]>(generateSprintMetrics(), {
      status: 200,
    })
  }),

  /**
   * GET /api/analytics/tasks/distribution
   * Returns paginated task data with optional filtering and sorting
   */
  http.get('/api/analytics/tasks/distribution', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50', 10)
    const priority = url.searchParams.get('priority') || undefined
    const status = url.searchParams.get('status') || undefined

    return HttpResponse.json<TaskDistributionResponse>(
      generateTaskDistributionData(page, pageSize, priority, status),
      { status: 200 },
    )
  }),
]
