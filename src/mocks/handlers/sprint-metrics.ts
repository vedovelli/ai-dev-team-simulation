/**
 * MSW Handlers for Sprint Metrics
 *
 * Mock API endpoints for sprint performance metrics:
 * - Individual sprint metrics
 * - Sprint comparison (current vs previous)
 */

import { http, HttpResponse } from 'msw'
import type { SprintMetrics } from '../../types/sprint'

/**
 * Generate realistic sprint metrics with some variance
 */
function generateSprintMetrics(sprintId: string, baseVelocity: number = 8): SprintMetrics {
  const velocity = baseVelocity + (Math.random() - 0.5) * 2
  const completedTasks = Math.round(velocity * 2)
  const totalTasks = Math.round(completedTasks + (Math.random() * 3))
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100)

  return {
    sprintId,
    totalPoints: totalTasks * 3,
    completedPoints: completedTasks * 3,
    remainingPoints: (totalTasks - completedTasks) * 3,
    daysRemaining: Math.max(0, Math.floor(Math.random() * 7)),
    daysElapsed: Math.floor(Math.random() * 10),
    sprintDuration: 14,
    velocity: Math.round(velocity * 10) / 10,
    onTrack: completionPercentage >= 50,
    completionPercentage,
  }
}

/**
 * MSW handlers for sprint metrics endpoints
 */
export const sprintMetricsHandlers = [
  /**
   * GET /api/sprints/:id/metrics
   * Returns metrics for a specific sprint
   */
  http.get('/api/sprints/:id/metrics', ({ params }) => {
    const { id } = params as { id: string }

    // Extract sprint number from ID (e.g., "sprint-2" -> 2)
    const sprintNum = parseInt(id.split('-')[1]) || 1
    const baseVelocity = 5 + sprintNum // Increasing velocity over time

    const metrics = generateSprintMetrics(id, baseVelocity)

    return HttpResponse.json<SprintMetrics>(metrics, { status: 200 })
  }),

  /**
   * GET /api/sprints/:id/comparison
   * Returns comparison of current sprint vs previous sprint
   */
  http.get('/api/sprints/:id/comparison', ({ params }) => {
    const { id } = params as { id: string }

    // Extract sprint number
    const currentSprintNum = parseInt(id.split('-')[1]) || 1

    // Generate current sprint metrics
    const currentBaseVelocity = 5 + currentSprintNum
    const current = generateSprintMetrics(id, currentBaseVelocity)

    // Generate previous sprint metrics (if not first sprint)
    let previous: SprintMetrics | null = null
    if (currentSprintNum > 1) {
      const previousId = `sprint-${currentSprintNum - 1}`
      const previousBaseVelocity = 5 + (currentSprintNum - 1)
      // Previous sprint should be "completed" with higher values
      previous = {
        ...generateSprintMetrics(previousId, previousBaseVelocity),
        completionPercentage: 90 + Math.random() * 10, // Higher completion rate for completed sprints
      }
    }

    // Calculate deltas
    const deltaVelocity = previous
      ? current.velocity - previous.velocity
      : 0
    const deltaCompletionRate = previous
      ? current.completionPercentage - previous.completionPercentage
      : 0
    const deltaTasksCompleted = previous
      ? current.completedPoints - previous.completedPoints
      : 0

    // Determine trend (neutral if within ±2%)
    const getTrend = (delta: number): 'up' | 'down' | 'neutral' => {
      if (Math.abs(delta) <= 2) return 'neutral'
      return delta > 0 ? 'up' : 'down'
    }

    return HttpResponse.json({
      current,
      previous,
      deltas: {
        velocity: {
          value: Math.round(deltaVelocity * 10) / 10,
          percentage: previous ? Math.round((deltaVelocity / previous.velocity) * 100) : 0,
          trend: getTrend(deltaVelocity),
        },
        completionRate: {
          value: Math.round(deltaCompletionRate * 10) / 10,
          percentage: deltaCompletionRate,
          trend: getTrend(deltaCompletionRate),
        },
        tasksCompleted: {
          value: deltaTasksCompleted,
          percentage: previous ? Math.round((deltaTasksCompleted / previous.completedPoints) * 100) : 0,
          trend: getTrend(deltaTasksCompleted),
        },
      },
      isFirstSprint: !previous,
    }, { status: 200 })
  }),
]
