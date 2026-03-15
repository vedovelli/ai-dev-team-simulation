/**
 * MSW Handlers for Sprint Analytics & Historical Metrics
 *
 * Provides multi-sprint analytics data including:
 * - Velocity trends (last N sprints)
 * - Capacity utilization per sprint
 * - Burndown pattern analysis
 * - Forecast accuracy comparison
 *
 * Used for sprint planning dashboards and predictive features.
 */

import { http, HttpResponse } from 'msw'
import type {
  SprintAnalyticsData,
  VelocityTrendDataPoint,
  CapacityUtilizationDataPoint,
  BurndownPatternAnalysis,
  ForecastAccuracy,
} from '../../types/sprint'

/**
 * Generate realistic historical sprint data
 * Simulates 5+ completed sprints with varying performance
 */
function generateHistoricalSprints(sprintId: string, range: number = 5) {
  const sprintNumbers = parseInt(sprintId.split('-')[1]) || 1
  const sprints = []

  // Generate sprints going backwards from current
  for (let i = 1; i <= range; i++) {
    const sprintNum = Math.max(1, sprintNumbers - i)
    sprints.push({
      id: `sprint-${sprintNum}`,
      number: sprintNum,
      name: `Sprint ${sprintNum}`,
      completedDate: new Date(2026, 0, 1 + sprintNum * 14).toISOString(),
    })
  }

  return sprints.reverse() // Oldest first
}

/**
 * Generate velocity trend data with realistic variance
 */
function generateVelocityTrends(
  sprintId: string,
  range: number,
): VelocityTrendDataPoint[] {
  const historicalSprints = generateHistoricalSprints(sprintId, range)
  const baseVelocity = 8
  const trends: VelocityTrendDataPoint[] = []

  historicalSprints.forEach((sprint, idx) => {
    // Simulate improving trend with some variance
    const variance = (Math.random() - 0.5) * 3
    const velocity = Math.max(5, baseVelocity + idx * 0.5 + variance)
    const plannedVelocity = Math.max(6, baseVelocity + idx * 0.4)

    trends.push({
      sprintId: sprint.id,
      sprintName: sprint.name,
      velocity: Math.round(velocity * 10) / 10,
      plannedVelocity: Math.round(plannedVelocity * 10) / 10,
      date: sprint.completedDate.split('T')[0],
    })
  })

  return trends
}

/**
 * Generate capacity utilization data
 */
function generateCapacityUtilization(
  sprintId: string,
  range: number,
): CapacityUtilizationDataPoint[] {
  const historicalSprints = generateHistoricalSprints(sprintId, range)
  const utilization: CapacityUtilizationDataPoint[] = []

  historicalSprints.forEach((sprint) => {
    const baseCapacity = 100
    const avgUtilization = 70 + (Math.random() - 0.5) * 20 // 60-80%
    const available = Math.round(baseCapacity * (1 - avgUtilization / 100))

    utilization.push({
      sprintId: sprint.id,
      sprintName: sprint.name,
      utilizationRate: Math.round(avgUtilization),
      allocatedCapacity: baseCapacity - available,
      availableCapacity: available,
      totalCapacity: baseCapacity,
      date: sprint.completedDate.split('T')[0],
    })
  })

  return utilization
}

/**
 * Generate burndown pattern analysis
 */
function generateBurndownPatterns(
  sprintId: string,
  range: number,
): BurndownPatternAnalysis[] {
  const historicalSprints = generateHistoricalSprints(sprintId, range)
  const patterns: BurndownPatternAnalysis[] = []

  historicalSprints.forEach((sprint, idx) => {
    const avgRate = 0.5 + (Math.random() - 0.5) * 0.1
    const steadiness = 60 + Math.random() * 35 // 60-95%

    // Early bursts more likely in recent sprints
    const hasEarlyBurst = Math.random() < 0.4 && idx > range - 3
    const hasEndSpurt = Math.random() < 0.3

    patterns.push({
      sprintId: sprint.id,
      sprintName: sprint.name,
      avgDailyCompletionRate: Math.round(avgRate * 10) / 10,
      steadiness: Math.round(steadiness),
      hasEarlyBurst,
      hasEndSpurt,
      peakCompletionDay: hasEarlyBurst ? 2 : hasEndSpurt ? 11 : 7,
    })
  })

  return patterns
}

/**
 * Generate forecast accuracy data
 */
function generateForecastAccuracy(
  sprintId: string,
  range: number,
): ForecastAccuracy[] {
  const historicalSprints = generateHistoricalSprints(sprintId, range)
  const accuracy: ForecastAccuracy[] = []

  historicalSprints.forEach((sprint) => {
    const projectedDate = new Date(sprint.completedDate)
    projectedDate.setDate(projectedDate.getDate() - (Math.random() * 2 - 1)) // ±1 day variance
    const actualDate = new Date(sprint.completedDate)

    const daysVariance = Math.round(
      (actualDate.getTime() - projectedDate.getTime()) / (1000 * 60 * 60 * 24),
    )
    const accuracyScore = Math.max(
      0,
      100 - Math.abs(daysVariance) * 15,
    )

    accuracy.push({
      sprintId: sprint.id,
      sprintName: sprint.name,
      projectedCompletionDate: projectedDate
        .toISOString()
        .split('T')[0],
      actualCompletionDate: actualDate.toISOString().split('T')[0],
      daysVariance,
      accuracyScore: Math.round(accuracyScore),
    })
  })

  return accuracy
}

/**
 * Calculate summary statistics from analytics data
 */
function calculateSummary(data: {
  velocityTrends: VelocityTrendDataPoint[]
  capacityUtilization: CapacityUtilizationDataPoint[]
  forecastAccuracy: ForecastAccuracy[]
}) {
  const { velocityTrends, capacityUtilization, forecastAccuracy } = data

  // Average velocity
  const avgVelocity =
    velocityTrends.length > 0
      ? Math.round(
          (velocityTrends.reduce((sum, t) => sum + t.velocity, 0) /
            velocityTrends.length) *
            10,
        ) / 10
      : 0

  // Velocity trend
  let velocityTrend: 'improving' | 'stable' | 'declining' = 'stable'
  if (velocityTrends.length >= 3) {
    const recent = velocityTrends.slice(-3)
    const avg1 = (recent[0].velocity + recent[1].velocity) / 2
    const avg2 = (recent[1].velocity + recent[2].velocity) / 2
    if (avg2 > avg1 + 0.5) velocityTrend = 'improving'
    else if (avg2 < avg1 - 0.5) velocityTrend = 'declining'
  }

  // Average capacity utilization
  const avgCapacityUtilization =
    capacityUtilization.length > 0
      ? Math.round(
          capacityUtilization.reduce((sum, c) => sum + c.utilizationRate, 0) /
            capacityUtilization.length,
        )
      : 0

  // Forecast accuracy rate
  const forecastAccuracyRate =
    forecastAccuracy.length > 0
      ? Math.round(
          forecastAccuracy.reduce((sum, f) => sum + f.accuracyScore, 0) /
            forecastAccuracy.length,
        )
      : 0

  // Recommended velocity for planning (slightly conservative)
  const recommendedVelocity = Math.round(avgVelocity * 0.95 * 10) / 10

  return {
    averageVelocity: avgVelocity,
    velocityTrend,
    averageCapacityUtilization: avgCapacityUtilization,
    forecastAccuracyRate: Math.round(forecastAccuracyRate),
    recommendedVelocity,
  }
}

/**
 * Generate complete sprint analytics data
 */
function generateSprintAnalytics(
  sprintId: string,
  range: number = 5,
): SprintAnalyticsData {
  const velocityTrends = generateVelocityTrends(sprintId, range)
  const capacityUtilization = generateCapacityUtilization(sprintId, range)
  const burndownPatterns = generateBurndownPatterns(sprintId, range)
  const forecastAccuracy = generateForecastAccuracy(sprintId, range)

  const summary = calculateSummary({
    velocityTrends,
    capacityUtilization,
    forecastAccuracy,
  })

  return {
    sprintId,
    range,
    velocityTrends,
    capacityUtilization,
    burndownPatterns,
    forecastAccuracy,
    summary,
  }
}

/**
 * MSW handler for sprint analytics endpoint
 */
export const sprintAnalyticsHandlers = [
  /**
   * GET /api/sprints/:id/analytics?range=5&metrics=velocity,capacity
   *
   * Returns historical sprint analytics data for planning and forecasting
   *
   * Query Parameters:
   * - range: number of past sprints to include (default: 5, max: 12)
   * - metrics: comma-separated list of metrics to include (optional)
   *
   * Response: SprintAnalyticsData
   */
  http.get('/api/sprints/:id/analytics', ({ params, request }) => {
    const { id } = params

    if (!id) {
      return HttpResponse.json(
        { error: 'Sprint ID is required' },
        { status: 400 },
      )
    }

    const url = new URL(request.url)
    const rangeParam = url.searchParams.get('range')
    const range = rangeParam ? Math.min(12, Math.max(1, parseInt(rangeParam))) : 5

    // Optional metrics filter (can be used in future for optimization)
    const metricsParam = url.searchParams.get('metrics')

    // Simulate 200ms latency for realistic data fetching
    const delay = Math.random() * 100 + 100

    return HttpResponse.json<SprintAnalyticsData>(
      generateSprintAnalytics(id as string, range),
      { status: 200, headers: { 'X-Simulated-Latency': `${delay}ms` } },
    )
  }),
]
