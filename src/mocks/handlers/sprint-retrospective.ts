/**
 * MSW Handlers for Sprint Retrospective Data Layer
 *
 * Provides historical sprint data and retrospective analytics for the last 6 sprints.
 * Includes velocity trends, burndown analysis, and team performance metrics.
 */

import { http, HttpResponse } from 'msw'
import type {
  SprintRetrospectiveData,
  HistoricalSprintData,
  VelocityDataPoint,
  BurndownAnalysis,
  TeamPerformanceMetrics,
  AgentPerformanceData,
} from '../../types/sprint-retrospective'
import {
  calculateVelocityTrend,
  velocityDataToChart,
  analyzeBurndown,
  compareBurndowns,
  burndownDataToChart,
  calculateTeamPerformance,
  aggregateTeamPerformance,
  calculateHealthScore,
} from '../../utils/retrospective-calculations'

/**
 * Generate 6 months of historical sprint data
 * Each sprint is 2 weeks, so 6 months = ~13 sprints total, we take the last 6
 */
function generateHistoricalSprints(): HistoricalSprintData[] {
  const sprints: HistoricalSprintData[] = []
  const now = new Date()

  // Generate 6 past sprints (2-week sprints)
  for (let i = 5; i >= 0; i--) {
    const endDate = new Date(now)
    endDate.setDate(endDate.getDate() - i * 14)

    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 14)

    // Simulate improving velocity trend
    const baseVelocity = 35
    const velocityVariance = Math.sin(i * 0.5) * 5 // Some oscillation
    const plannedVelocity = Math.round(baseVelocity + velocityVariance)
    const actualVelocity = Math.round(plannedVelocity * (0.85 + Math.random() * 0.3))

    const taskCount = Math.round(plannedVelocity * 1.2)
    const completedCount = Math.round((actualVelocity / plannedVelocity) * taskCount)

    sprints.push({
      sprintId: `sprint-${5 - i}`,
      sprintName: `Sprint ${5 - i} - Feature Development Wave ${Math.floor(i / 2) + 1}`,
      status: i === 0 ? 'completed' : 'completed',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      plannedVelocity,
      actualVelocity,
      taskCount,
      completedCount,
      teamSize: 4 + Math.floor(Math.random() * 2),
    })
  }

  return sprints
}

/**
 * Generate burndown data for a sprint
 */
function generateDailyCompletions(totalTasks: number, completedCount: number): number[] {
  const dailyCompletions: number[] = []
  const sprintDays = 10 // 2-week sprint, 10 working days

  // Simulate realistic burndown pattern
  let remaining = completedCount
  const avgDaily = completedCount / sprintDays

  for (let day = 0; day < sprintDays; day++) {
    // Add some randomness to daily completion
    const variance = avgDaily * (Math.random() * 0.6 + 0.7)
    const dayCompleted = Math.round(Math.min(variance, remaining))
    dailyCompletions.push(dayCompleted)
    remaining -= dayCompleted
  }

  return dailyCompletions
}

/**
 * Generate team performance data for a sprint
 */
function generateTeamPerformanceForSprint(
  historicalSprint: HistoricalSprintData
): TeamPerformanceMetrics {
  const totalCycleTimeHours = historicalSprint.completedCount * (18 + Math.random() * 12)
  const allocatedCapacity = Math.round(historicalSprint.taskCount * 8)
  const availableCapacity = Math.round(historicalSprint.teamSize * 40)

  return calculateTeamPerformance(
    historicalSprint.sprintId,
    historicalSprint.sprintName,
    historicalSprint.taskCount,
    historicalSprint.completedCount,
    Math.floor(Math.random() * 2),
    Math.floor(Math.random() * 1),
    totalCycleTimeHours,
    historicalSprint.teamSize,
    allocatedCapacity,
    availableCapacity
  )
}

/**
 * Generate agent performance data for a sprint
 */
function generateAgentPerformance(
  completedCount: number,
  teamSize: number
): AgentPerformanceData[] {
  const agents = ['Alice', 'Bob', 'Carol', 'David', 'Eve']
  const agentData: AgentPerformanceData[] = []

  const tasksPerAgent = Math.ceil(completedCount / teamSize)

  for (let i = 0; i < teamSize; i++) {
    const agentCompleted = Math.round(tasksPerAgent * (0.8 + Math.random() * 0.4))
    agentData.push({
      agentId: agents[i].toLowerCase(),
      agentName: agents[i],
      tasksCompleted: agentCompleted,
      avgCycleTime: 18 + Math.random() * 12,
      velocityContribution: (agentCompleted / completedCount) * 100,
      capacityUtilization: 60 + Math.random() * 30,
    })
  }

  return agentData
}

/**
 * Get sprint retrospective data for a specific sprint
 */
function getSprintRetrospectiveData(sprintId: string): SprintRetrospectiveData | null {
  const historicalSprints = generateHistoricalSprints()
  const currentSprint = historicalSprints.find(s => s.sprintId === sprintId)

  if (!currentSprint) {
    return null
  }

  // Get the last 6 sprints for comparison
  const comparisonSprints = historicalSprints.slice(-6)

  // Calculate velocity trend
  const velocityTrend = calculateVelocityTrend(comparisonSprints)
  const velocityChartData = velocityDataToChart(velocityTrend.dataPoints)

  // Analyze burndown
  const dailyCompletions = generateDailyCompletions(
    currentSprint.taskCount,
    currentSprint.completedCount
  )
  const burndownAnalysis = analyzeBurndown(
    currentSprint.sprintId,
    currentSprint.sprintName,
    currentSprint.taskCount,
    dailyCompletions
  )

  // Compare burndowns across sprints
  const allBurndowns = comparisonSprints.map(sprint => {
    const dailyCompletions = generateDailyCompletions(sprint.taskCount, sprint.completedCount)
    return analyzeBurndown(sprint.sprintId, sprint.sprintName, sprint.taskCount, dailyCompletions)
  })
  const burndownComparison = compareBurndowns(allBurndowns)
  const burndownChartData = burndownDataToChart(burndownAnalysis)

  // Calculate team performance
  const currentMetrics = generateTeamPerformanceForSprint(currentSprint)
  const allMetrics = comparisonSprints.map(sprint => generateTeamPerformanceForSprint(sprint))
  const teamAggregation = aggregateTeamPerformance(allMetrics)

  // Generate agent performance
  const agentPerformance = generateAgentPerformance(
    currentSprint.completedCount,
    currentSprint.teamSize
  )

  // Calculate health score
  const healthScore = calculateHealthScore(currentMetrics)

  // Generate insights and recommendations
  const keyInsights: string[] = []
  const recommendations: string[] = []

  if (currentMetrics.completionRate < 70) {
    keyInsights.push('Sprint completion rate is below target (70%)')
    recommendations.push('Consider reducing sprint scope or providing additional support')
  }

  if (currentMetrics.avgCycleTime > 30) {
    keyInsights.push('Average cycle time is higher than optimal (>30 hours)')
    recommendations.push('Investigate blockers and prioritize task dependencies')
  }

  if (burndownAnalysis.steadiness < 50) {
    keyInsights.push('Uneven task completion pattern detected')
    recommendations.push('Encourage consistent daily task completion rate')
  }

  if (velocityTrend.trend === 'improving') {
    keyInsights.push('Velocity trend is improving')
    recommendations.push('Maintain current practices and continue monitoring')
  }

  if (teamAggregation.avgCapacityUtilization < 60) {
    keyInsights.push('Team capacity utilization is below target')
    recommendations.push('Review team allocation or consider increasing sprint scope')
  }

  return {
    sprintId: currentSprint.sprintId,
    sprintName: currentSprint.sprintName,
    period: {
      startDate: currentSprint.startDate,
      endDate: currentSprint.endDate,
    },
    velocityTrend: {
      dataPoints: velocityTrend.dataPoints,
      chartData: velocityChartData,
      average: Math.round(velocityTrend.average),
      trend: velocityTrend.trend,
    },
    burndownAnalysis: {
      current: burndownAnalysis,
      comparison: burndownComparison,
      chartData: burndownChartData,
    },
    teamPerformance: {
      metrics: currentMetrics,
      aggregation: teamAggregation,
      byAgent: agentPerformance,
    },
    summary: {
      totalSprintsAnalyzed: comparisonSprints.length,
      healthScore,
      keyInsights: keyInsights.length > 0 ? keyInsights : ['Team performance is on track'],
      recommendations: recommendations.length > 0 ? recommendations : ['Continue current workflow'],
    },
  }
}

/**
 * MSW handlers for sprint retrospective endpoints
 */
export const sprintRetrospectiveHandlers = [
  /**
   * GET /api/sprints/:id/retrospective
   * Returns comprehensive retrospective data for a sprint
   */
  http.get('/api/sprints/:id/retrospective', async ({ params }) => {
    const { id } = params

    if (!id) {
      return HttpResponse.json(
        { error: 'Sprint ID is required' },
        { status: 400 }
      )
    }

    // Simulate network latency (200-400ms)
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 200))

    const data = getSprintRetrospectiveData(id as string)

    if (!data) {
      return HttpResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json<SprintRetrospectiveData>(data, { status: 200 })
  }),

  /**
   * GET /api/sprints/retrospective/historical
   * Returns historical sprint data for the last 6 months
   */
  http.get('/api/sprints/retrospective/historical', async () => {
    // Simulate network latency (200-300ms)
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 100))

    const historicalSprints = generateHistoricalSprints()

    return HttpResponse.json<HistoricalSprintData[]>(historicalSprints, { status: 200 })
  }),
]
