/**
 * MSW Handlers for Sprint Performance Analytics
 *
 * Mock API endpoints for sprint metrics and agent workload data.
 * Provides:
 * - Sprint health metrics (tasks, completion, timeline, burndown data)
 * - Agent workload distribution and capacity
 * - Real-time-ish data with slight variance for realistic polling
 */

import { http, HttpResponse } from 'msw'
import type { SprintHealthData } from '../../types/sprint'
import type { WorkloadData } from '../../hooks/useAgentWorkload'

/**
 * Generate mock burndown data points for visualization
 * Includes both ideal and actual burndown curves
 */
function generateBurndownData(totalTasks: number, completedTasks: number, daysIntoSprint: number) {
  const dataPoints = []
  const sprintDuration = 14 // 2 weeks

  for (let day = 0; day <= Math.min(daysIntoSprint, sprintDuration); day++) {
    // Ideal burndown: linear decrease
    const idealRemaining = Math.max(0, totalTasks - (totalTasks / sprintDuration) * day)

    // Actual burndown: more realistic with variations
    let actualRemaining = totalTasks
    if (day > 0) {
      // Simulate realistic task completion patterns
      const avgCompletionRate = completedTasks / Math.max(daysIntoSprint, 1)
      actualRemaining = Math.max(0, totalTasks - avgCompletionRate * day - Math.random() * 2)
    }

    dataPoints.push({
      day,
      ideal: Math.round(idealRemaining),
      actual: Math.round(actualRemaining),
      date: new Date(Date.now() - (daysIntoSprint - day) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
  }

  return dataPoints
}

/**
 * Generate mock sprint health metrics with realistic data variance
 */
function generateSprintMetrics(sprintId: string): SprintHealthData {
  const sprintMap: Record<string, { name: string; totalTasks: number; completedTasks: number; inProgressTasks: number; daysIntoSprint: number }> = {
    'sprint-1': { name: 'Sprint 1 - Auth & Core Features', totalTasks: 5, completedTasks: 5, inProgressTasks: 0, daysIntoSprint: 14 },
    'sprint-2': { name: 'Sprint 2 - API & Data Layer', totalTasks: 6, completedTasks: 3, inProgressTasks: 2, daysIntoSprint: 7 },
    'sprint-3': { name: 'Sprint 3 - UI Polish & Performance', totalTasks: 3, completedTasks: 0, inProgressTasks: 1, daysIntoSprint: 0 },
  }

  const sprintConfig = sprintMap[sprintId] || { name: 'Unknown Sprint', totalTasks: 10, completedTasks: 5, inProgressTasks: 2, daysIntoSprint: 5 }

  const startDate = new Date(2026, 1, 1 + (parseInt(sprintId.split('-')[1]) - 1) * 14)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 14)

  return {
    sprint: {
      id: sprintId,
      name: sprintConfig.name,
      status: sprintId === 'sprint-1' ? 'completed' : sprintId === 'sprint-2' ? 'active' : 'planning',
      goals: 'Sprint goals for ' + sprintConfig.name,
      tasks: [],
      estimatedPoints: sprintConfig.totalTasks,
      taskCount: sprintConfig.totalTasks,
      completedCount: sprintConfig.completedTasks,
      createdAt: startDate.toISOString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    summary: {
      totalTasks: sprintConfig.totalTasks,
      completedTasks: sprintConfig.completedTasks,
      inProgressTasks: sprintConfig.inProgressTasks,
      remainingTasks: sprintConfig.totalTasks - sprintConfig.completedTasks - sprintConfig.inProgressTasks,
      completionPercentage: sprintConfig.totalTasks > 0 ? Math.round((sprintConfig.completedTasks / sprintConfig.totalTasks) * 100) : 0,
    },
    metrics: {
      sprintId,
      totalPoints: sprintConfig.totalTasks,
      completedPoints: sprintConfig.completedTasks,
      remainingPoints: sprintConfig.totalTasks - sprintConfig.completedTasks,
      daysRemaining: Math.max(0, 14 - sprintConfig.daysIntoSprint),
      daysElapsed: sprintConfig.daysIntoSprint,
      sprintDuration: 14,
      velocity: Math.round((sprintConfig.completedTasks / Math.max(sprintConfig.daysIntoSprint, 1)) * 10) / 10,
      onTrack: sprintConfig.completedTasks >= (sprintConfig.totalTasks / 14) * sprintConfig.daysIntoSprint,
      completionPercentage: sprintConfig.totalTasks > 0 ? Math.round((sprintConfig.completedTasks / sprintConfig.totalTasks) * 100) : 0,
    },
    burndownData: generateBurndownData(sprintConfig.totalTasks, sprintConfig.completedTasks, sprintConfig.daysIntoSprint),
    agentWorkload: [
      {
        agent: 'alice',
        taskCount: 3,
        completedCount: 3,
        inProgressCount: 0,
        totalEstimatedHours: 24,
        utilizationRate: 80,
      },
      {
        agent: 'bob',
        taskCount: 2,
        completedCount: 1,
        inProgressCount: 1,
        totalEstimatedHours: 16,
        utilizationRate: 70,
      },
      {
        agent: 'carol',
        taskCount: 1,
        completedCount: 0,
        inProgressCount: 1,
        totalEstimatedHours: 8,
        utilizationRate: 50,
      },
    ],
  }
}

/**
 * Generate mock agent workload data
 */
function generateAgentWorkload(): WorkloadData[] {
  return [
    {
      agentId: 'alice',
      role: 'Senior Developer',
      status: 'active',
      activeTasksCount: 2,
      totalEstimatedHours: 24,
      sprintCapacity: 30,
      utilizationPercent: 80,
    },
    {
      agentId: 'bob',
      role: 'Developer',
      status: 'active',
      activeTasksCount: 2,
      totalEstimatedHours: 16,
      sprintCapacity: 25,
      utilizationPercent: 64,
    },
    {
      agentId: 'carol',
      role: 'Developer',
      status: 'active',
      activeTasksCount: 1,
      totalEstimatedHours: 8,
      sprintCapacity: 20,
      utilizationPercent: 40,
    },
    {
      agentId: 'david',
      role: 'QA Engineer',
      status: 'active',
      activeTasksCount: 1,
      totalEstimatedHours: 10,
      sprintCapacity: 20,
      utilizationPercent: 50,
    },
    {
      agentId: 'eve',
      role: 'Developer',
      status: 'unavailable',
      activeTasksCount: 0,
      totalEstimatedHours: 0,
      sprintCapacity: 25,
      utilizationPercent: 0,
    },
  ]
}

/**
 * MSW handlers for sprint analytics endpoints
 */
export const sprintAnalyticsHandlers = [
  /**
   * GET /api/sprints/:id/metrics
   * Returns sprint health metrics and task completion data
   */
  http.get('/api/sprints/:id/metrics', ({ params }) => {
    const { id } = params

    if (!id) {
      return HttpResponse.json(
        { error: 'Sprint ID is required' },
        { status: 400 }
      )
    }

    return HttpResponse.json<SprintHealthData>(
      generateSprintMetrics(id as string),
      { status: 200 }
    )
  }),

  /**
   * GET /api/agents/workload
   * Returns workload distribution across all agents
   * Supports optional sprint filter
   */
  http.get('/api/agents/workload', ({ request }) => {
    const url = new URL(request.url)
    const sprintId = url.searchParams.get('sprintId')

    // In a real app, would filter by sprint
    // For now, return all workload data
    return HttpResponse.json<WorkloadData[]>(
      generateAgentWorkload(),
      { status: 200 }
    )
  }),

  /**
   * GET /api/agents/:id/workload
   * Returns workload for a specific agent
   */
  http.get('/api/agents/:id/workload', ({ params }) => {
    const { id } = params

    if (!id) {
      return HttpResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    const allWorkload = generateAgentWorkload()
    const agentWorkload = allWorkload.find((w) => w.agentId === id)

    if (!agentWorkload) {
      return HttpResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json<WorkloadData>(agentWorkload, { status: 200 })
  }),
]
