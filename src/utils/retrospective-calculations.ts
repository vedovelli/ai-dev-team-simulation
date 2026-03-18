/**
 * Pure functions for sprint retrospective analytics and calculations
 */

import type {
  VelocityDataPoint,
  BurndownAnalysis,
  BurndownComparison,
  TeamPerformanceMetrics,
  ChartDataPoint,
  HistoricalSprintData,
} from '../types/sprint-retrospective'

/**
 * Calculate velocity trend from historical sprint data
 */
export function calculateVelocityTrend(
  sprints: HistoricalSprintData[]
): {
  dataPoints: VelocityDataPoint[]
  average: number
  trend: 'improving' | 'stable' | 'declining'
} {
  const sortedSprints = [...sprints].sort((a, b) =>
    new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
  )

  const dataPoints: VelocityDataPoint[] = sortedSprints.map((sprint) => ({
    sprintId: sprint.sprintId,
    sprintName: sprint.sprintName,
    plannedVelocity: sprint.plannedVelocity,
    actualVelocity: sprint.actualVelocity,
    date: sprint.endDate,
  }))

  const average = dataPoints.length > 0
    ? dataPoints.reduce((sum, dp) => sum + dp.actualVelocity, 0) / dataPoints.length
    : 0

  // Calculate trend: compare first half to second half
  const midpoint = Math.floor(dataPoints.length / 2)
  const firstHalf = dataPoints.slice(0, midpoint)
  const secondHalf = dataPoints.slice(midpoint)

  let trend: 'improving' | 'stable' | 'declining' = 'stable'

  if (firstHalf.length > 0 && secondHalf.length > 0) {
    const firstAvg = firstHalf.reduce((sum, dp) => sum + dp.actualVelocity, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, dp) => sum + dp.actualVelocity, 0) / secondHalf.length
    const change = ((secondAvg - firstAvg) / firstAvg) * 100

    if (change > 5) {
      trend = 'improving'
    } else if (change < -5) {
      trend = 'declining'
    }
  }

  return { dataPoints, average, trend }
}

/**
 * Convert velocity data points to chart format
 */
export function velocityDataToChart(
  dataPoints: VelocityDataPoint[]
): ChartDataPoint[] {
  return dataPoints.map((dp, index) => ({
    x: dp.sprintName,
    y: dp.actualVelocity,
  }))
}

/**
 * Analyze burndown pattern for a sprint
 */
export function analyzeBurndown(
  sprintId: string,
  sprintName: string,
  totalTasks: number,
  dailyCompletions: number[]
): BurndownAnalysis {
  const completedTasks = dailyCompletions.reduce((sum, count) => sum + count, 0)

  // Calculate burndown rate (tasks per day)
  const burndownRate = dailyCompletions.length > 0
    ? completedTasks / dailyCompletions.length
    : 0

  // Calculate steadiness: lower variance = higher steadiness
  const avgDaily = completedTasks / Math.max(dailyCompletions.length, 1)
  const variance = dailyCompletions.length > 1
    ? dailyCompletions.reduce((sum, count) => sum + Math.pow(count - avgDaily, 2), 0) / dailyCompletions.length
    : 0
  const stdDev = Math.sqrt(variance)
  // Steadiness: 100 = no variance, 0 = very high variance
  const steadiness = Math.max(0, Math.min(100, 100 - (stdDev * 10)))

  // Detect early burst: > 40% of work in first 30% of sprint
  const earlyDays = Math.ceil(dailyCompletions.length * 0.3)
  const earlyCompleted = dailyCompletions.slice(0, earlyDays).reduce((sum, count) => sum + count, 0)
  const hasEarlyBurst = earlyCompleted > (completedTasks * 0.4)

  // Detect end spurt: > 30% of work in last 30% of sprint
  const lateDays = Math.ceil(dailyCompletions.length * 0.3)
  const lateCompleted = dailyCompletions.slice(-lateDays).reduce((sum, count) => sum + count, 0)
  const hasEndSpurt = lateCompleted > (completedTasks * 0.3)

  // Find peak completion day
  let peakCompletionDay = 0
  let maxCompleted = 0
  dailyCompletions.forEach((count, index) => {
    if (count > maxCompleted) {
      maxCompleted = count
      peakCompletionDay = index
    }
  })

  return {
    sprintId,
    sprintName,
    totalTasks,
    completedTasks,
    burndownRate,
    steadiness: Math.round(steadiness),
    hasEarlyBurst,
    hasEndSpurt,
    peakCompletionDay,
  }
}

/**
 * Compare burndown patterns across sprints
 */
export function compareBurndowns(
  analyses: BurndownAnalysis[]
): BurndownComparison {
  if (analyses.length === 0) {
    return {
      sprintIds: [],
      averageBurndownRate: 0,
      mostSteadySprint: '',
      mostUnstableSprint: '',
      avgSteadiness: 0,
      improvementTrend: 'stable',
    }
  }

  const avgBurndownRate = analyses.reduce((sum, a) => sum + a.burndownRate, 0) / analyses.length
  const avgSteadiness = analyses.reduce((sum, a) => sum + a.steadiness, 0) / analyses.length

  // Find most and least steady sprints
  const sorted = [...analyses].sort((a, b) => b.steadiness - a.steadiness)
  const mostSteadySprint = sorted[0]?.sprintId || ''
  const mostUnstableSprint = sorted[sorted.length - 1]?.sprintId || ''

  // Calculate trend: compare first half to second half
  const midpoint = Math.floor(analyses.length / 2)
  const firstHalf = analyses.slice(0, midpoint)
  const secondHalf = analyses.slice(midpoint)
  let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable'

  if (firstHalf.length > 0 && secondHalf.length > 0) {
    const firstAvgSteadiness = firstHalf.reduce((sum, a) => sum + a.steadiness, 0) / firstHalf.length
    const secondAvgSteadiness = secondHalf.reduce((sum, a) => sum + a.steadiness, 0) / secondHalf.length
    const change = secondAvgSteadiness - firstAvgSteadiness

    if (change > 5) {
      improvementTrend = 'improving'
    } else if (change < -5) {
      improvementTrend = 'declining'
    }
  }

  return {
    sprintIds: analyses.map(a => a.sprintId),
    averageBurndownRate: Math.round(avgBurndownRate * 10) / 10,
    mostSteadySprint,
    mostUnstableSprint,
    avgSteadiness: Math.round(avgSteadiness),
    improvementTrend,
  }
}

/**
 * Convert burndown analysis to chart format
 */
export function burndownDataToChart(
  analysis: BurndownAnalysis
): ChartDataPoint[] {
  const dataPoints: ChartDataPoint[] = []

  for (let day = 0; day <= 14; day++) {
    const idealRemaining = Math.max(0, analysis.totalTasks - (analysis.totalTasks / 14) * day)
    dataPoints.push({
      x: day,
      y: idealRemaining,
    })
  }

  return dataPoints
}

/**
 * Calculate team performance metrics for a sprint
 */
export function calculateTeamPerformance(
  sprintId: string,
  sprintName: string,
  taskCount: number,
  completedCount: number,
  inProgressCount: number,
  canceledCount: number,
  totalCycleTimeHours: number,
  teamSize: number,
  allocatedCapacity: number,
  availableCapacity: number
): TeamPerformanceMetrics {
  const totalCapacity = allocatedCapacity + availableCapacity

  return {
    sprintId,
    sprintName,
    completionRate: taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0,
    avgCycleTime: completedCount > 0 ? Math.round(totalCycleTimeHours / completedCount * 10) / 10 : 0,
    tasksCompleted: completedCount,
    tasksInProgress: inProgressCount,
    tasksCanceled: canceledCount,
    teamSize,
    avgTasksPerMember: completedCount > 0 ? Math.round((completedCount / teamSize) * 10) / 10 : 0,
    capacityUtilization: totalCapacity > 0 ? Math.round((allocatedCapacity / totalCapacity) * 100) : 0,
  }
}

/**
 * Calculate team performance aggregation across sprints
 */
export function aggregateTeamPerformance(metrics: TeamPerformanceMetrics[]) {
  if (metrics.length === 0) {
    return {
      sprints: [],
      avgCompletionRate: 0,
      avgCycleTime: 0,
      avgCapacityUtilization: 0,
      completionRateTrend: 'stable' as const,
      cycleTimeTrend: 'stable' as const,
    }
  }

  const avgCompletionRate = metrics.reduce((sum, m) => sum + m.completionRate, 0) / metrics.length
  const avgCycleTime = metrics.reduce((sum, m) => sum + m.avgCycleTime, 0) / metrics.length
  const avgCapacityUtilization = metrics.reduce((sum, m) => sum + m.capacityUtilization, 0) / metrics.length

  // Calculate trends
  const midpoint = Math.floor(metrics.length / 2)
  const firstHalf = metrics.slice(0, midpoint)
  const secondHalf = metrics.slice(midpoint)

  let completionRateTrend: 'improving' | 'stable' | 'declining' = 'stable'
  let cycleTimeTrend: 'improving' | 'stable' | 'declining' = 'stable'

  if (firstHalf.length > 0 && secondHalf.length > 0) {
    const firstCompletionRate = firstHalf.reduce((sum, m) => sum + m.completionRate, 0) / firstHalf.length
    const secondCompletionRate = secondHalf.reduce((sum, m) => sum + m.completionRate, 0) / secondHalf.length
    const completionChange = secondCompletionRate - firstCompletionRate

    if (completionChange > 5) {
      completionRateTrend = 'improving'
    } else if (completionChange < -5) {
      completionRateTrend = 'declining'
    }

    const firstCycleTime = firstHalf.reduce((sum, m) => sum + m.avgCycleTime, 0) / firstHalf.length
    const secondCycleTime = secondHalf.reduce((sum, m) => sum + m.avgCycleTime, 0) / secondHalf.length
    const cycleTimeChange = firstCycleTime - secondCycleTime // Lower is better

    if (cycleTimeChange > 2) {
      cycleTimeTrend = 'improving'
    } else if (cycleTimeChange < -2) {
      cycleTimeTrend = 'declining'
    }
  }

  return {
    sprints: metrics,
    avgCompletionRate: Math.round(avgCompletionRate),
    avgCycleTime: Math.round(avgCycleTime * 10) / 10,
    avgCapacityUtilization: Math.round(avgCapacityUtilization),
    completionRateTrend,
    cycleTimeTrend,
  }
}

/**
 * Calculate health score (0-100) based on metrics
 */
export function calculateHealthScore(metrics: TeamPerformanceMetrics): number {
  let score = 100

  // Deduct for low completion rate (target: 80%)
  const completionPenalty = Math.max(0, (80 - metrics.completionRate) * 0.5)
  score -= completionPenalty

  // Deduct for high cycle time (target: <24 hours)
  const cycleTimePenalty = Math.max(0, (metrics.avgCycleTime - 24) * 1)
  score -= cycleTimePenalty

  // Deduct for low capacity utilization (target: 70%)
  const capacityPenalty = Math.max(0, (70 - metrics.capacityUtilization) * 0.3)
  score -= capacityPenalty

  return Math.max(0, Math.round(score))
}
