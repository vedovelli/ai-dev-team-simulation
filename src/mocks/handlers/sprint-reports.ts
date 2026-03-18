/**
 * MSW Handlers for Sprint Performance Reports
 *
 * Mock API endpoints for sprint analytics and reporting:
 * - Sprint performance metrics (completion rate, velocity)
 * - Agent performance breakdown
 * - Burndown data for historical analysis
 */

import { http, HttpResponse } from 'msw'
import type { SprintReport } from '../../types/reports'

/**
 * Generate mock agents for performance data
 */
function generateAgents() {
  return [
    { id: 'agent-1', name: 'Alice' },
    { id: 'agent-2', name: 'Bob' },
    { id: 'agent-3', name: 'Charlie' },
    { id: 'agent-4', name: 'Diana' },
  ]
}

/**
 * Generate completion rate trend for last N sprints
 */
function generateCompletionRateTrend(sprintCount: number = 5) {
  const sprints = [
    { id: 'sprint-5', name: 'Sprint 5', date: '2025-12-15' },
    { id: 'sprint-4', name: 'Sprint 4', date: '2026-01-01' },
    { id: 'sprint-3', name: 'Sprint 3', date: '2026-01-15' },
    { id: 'sprint-2', name: 'Sprint 2', date: '2026-02-01' },
    { id: 'sprint-1', name: 'Sprint 1', date: '2026-02-15' },
  ]

  return sprints.slice(0, sprintCount).map((sprint) => ({
    sprintId: sprint.id,
    sprintName: sprint.name,
    completionRate: Math.floor(70 + Math.random() * 25), // 70-95%
    date: sprint.date,
  }))
}

/**
 * Generate velocity trend for last N sprints
 */
function generateVelocityTrend(sprintCount: number = 5) {
  const sprints = [
    { id: 'sprint-5', name: 'Sprint 5', date: '2025-12-15', duration: 14 },
    { id: 'sprint-4', name: 'Sprint 4', date: '2026-01-01', duration: 14 },
    { id: 'sprint-3', name: 'Sprint 3', date: '2026-01-15', duration: 14 },
    { id: 'sprint-2', name: 'Sprint 2', date: '2026-02-01', duration: 14 },
    { id: 'sprint-1', name: 'Sprint 1', date: '2026-02-15', duration: 14 },
  ]

  return sprints.slice(0, sprintCount).map((sprint) => {
    const velocity = 30 + Math.floor(Math.random() * 25) // 30-55 points
    return {
      sprintId: sprint.id,
      sprintName: sprint.name,
      velocity,
      plannedVelocity: velocity + Math.floor(Math.random() * 10 - 5), // ±5 from actual
      date: sprint.date,
      sprintDuration: sprint.duration,
    }
  })
}

/**
 * Generate agent performance breakdown
 */
function generateAgentPerformance() {
  const agents = generateAgents()

  return agents.map((agent) => ({
    agentId: agent.id,
    agentName: agent.name,
    tasksCompleted: Math.floor(Math.random() * 15) + 5, // 5-20 tasks
    tasksInProgress: Math.floor(Math.random() * 3) + 1, // 1-3 tasks
    avgCycleTime: Math.floor(Math.random() * 24) + 12, // 12-36 hours
    utilization: Math.floor(Math.random() * 40) + 60, // 60-100%
    efficiency: Math.floor(Math.random() * 20) / 100 + 0.8, // 0.8-1.0
  }))
}

/**
 * Generate burndown data points for a sprint
 */
function generateBurndownData(sprintId: string) {
  const sprintDuration = 14 // 2 weeks
  const totalPoints = 40 + Math.floor(Math.random() * 20) // 40-60 points
  const dataPoints = []

  // Simulate realistic burndown with some variation
  let idealRemaining = totalPoints
  let actualRemaining = totalPoints
  let lastActualRemaining = totalPoints

  for (let day = 0; day <= sprintDuration; day++) {
    // Ideal burndown: linear
    idealRemaining = Math.max(0, totalPoints - (totalPoints / sprintDuration) * day)

    // Actual burndown: realistic with some randomness and trends
    if (day > 0) {
      const dailyBurnRate = (Math.random() * 4 + 2) // 2-6 points per day
      actualRemaining = Math.max(0, lastActualRemaining - dailyBurnRate)
      lastActualRemaining = actualRemaining
    }

    const date = new Date()
    date.setDate(date.getDate() - (sprintDuration - day))

    dataPoints.push({
      day,
      date: date.toISOString().split('T')[0],
      ideal: Math.round(idealRemaining),
      actual: Math.round(actualRemaining),
    })
  }

  return dataPoints
}

/**
 * Generate complete sprint report
 */
function generateSprintReport(sprintId: string): SprintReport {
  const completionTrend = generateCompletionRateTrend(5)
  const velocityTrend = generateVelocityTrend(5)
  const agentPerformance = generateAgentPerformance()
  const burndownData = generateBurndownData(sprintId)

  // Calculate summary metrics
  const avgCompletionRate = Math.round(
    completionTrend.reduce((sum, point) => sum + point.completionRate, 0) /
      completionTrend.length,
  )

  const avgVelocity = Math.round(
    velocityTrend.reduce((sum, point) => sum + point.velocity, 0) /
      velocityTrend.length,
  )

  const totalTasksCompleted = agentPerformance.reduce(
    (sum, agent) => sum + agent.tasksCompleted,
    0,
  )

  const avgCycleTime = Math.round(
    agentPerformance.reduce((sum, agent) => sum + agent.avgCycleTime, 0) /
      agentPerformance.length,
  )

  const teamUtilization = Math.round(
    agentPerformance.reduce((sum, agent) => sum + agent.utilization, 0) /
      agentPerformance.length,
  )

  return {
    sprintId,
    sprintName: `Sprint ${sprintId}`,
    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
    completionRateTrend,
    velocityTrend,
    agentPerformance,
    burndownData,
    summary: {
      avgCompletionRate,
      avgVelocity,
      totalTasksCompleted,
      avgCycleTime,
      teamUtilization,
    },
  }
}

/**
 * MSW handlers for sprint report endpoints
 */
export const sprintReportsHandlers = [
  http.get('/api/sprints/:id/report', ({ params }) => {
    const { id } = params

    if (!id || typeof id !== 'string') {
      return HttpResponse.json({ error: 'Invalid sprint ID' }, { status: 400 })
    }

    const report = generateSprintReport(id)

    return HttpResponse.json(report, { status: 200 })
  }),
]
