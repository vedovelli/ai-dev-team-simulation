/**
 * MSW Handler for Sprint Velocity Trends
 *
 * Mock API endpoint for historical sprint velocity data.
 * Provides synthetic data for the last N completed sprints with realistic variance.
 */

import { http, HttpResponse } from 'msw'
import type { SprintVelocityRaw } from '../../types/sprint'

/**
 * Generate realistic synthetic sprint velocity data
 * Returns completed sprints with velocity between 60-90% completion
 */
function generateSprintVelocityData(lastN: number): SprintVelocityRaw[] {
  const data: SprintVelocityRaw[] = []
  const baseDate = new Date(2026, 0, 1) // Jan 1, 2026

  for (let i = 0; i < lastN; i++) {
    // Deterministic but varied completion rates (60-90%)
    const seed = (i + 1) * 12321 // arbitrary multiplier for variance
    const completionRate = 0.6 + ((seed % 30) / 100) // 60-90%

    const plannedPoints = 20 + (i % 5) // 20-24 points
    const completedPoints = Math.round(plannedPoints * completionRate)

    const startDate = new Date(baseDate)
    startDate.setDate(startDate.getDate() + i * 14) // 14-day sprints

    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 14)

    data.push({
      sprintId: `sprint-${i + 1}`,
      sprintName: `Sprint ${i + 1}`,
      plannedPoints,
      completedPoints,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    })
  }

  // Return in reverse chronological order (most recent first)
  return data.reverse()
}

/**
 * MSW handlers for sprint velocity endpoints
 */
export const sprintVelocityHandlers = [
  /**
   * GET /api/sprints/velocity?last=<n>
   * Returns last N completed sprints with velocity data
   * Defaults to 5 sprints, max 10
   * Simulates 150-300ms latency
   */
  http.get('/api/sprints/velocity', async ({ request }) => {
    const url = new URL(request.url)
    const lastParam = url.searchParams.get('last')
    let last = 5 // default

    if (lastParam) {
      const parsed = parseInt(lastParam, 10)
      // Validate: between 1-10
      last = Math.min(10, Math.max(1, parsed || 5))
    }

    // Simulate network latency (150-300ms)
    await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 150))

    const velocityData = generateSprintVelocityData(last)

    return HttpResponse.json<SprintVelocityRaw[]>(velocityData, { status: 200 })
  }),
]
