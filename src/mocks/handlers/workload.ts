/**
 * MSW Handlers for Agent Workload Balancing Dashboard
 *
 * Mock API endpoints for agent workload capacity planning:
 * - Get all agents with workload metrics
 * - Get individual agent workload details
 * - Realistic workload distribution across team
 */

import { http, HttpResponse } from 'msw'
import type { WorkloadData } from '../../hooks/useAgentWorkload'

/**
 * Generate realistic workload data for all agents
 * Varies by agent role and task assignments
 */
function generateAgentWorkloads(): WorkloadData[] {
  const roles = ['frontend', 'backend', 'devops', 'qa', 'design', 'pm']
  const statuses = ['idle', 'active', 'busy', 'blocked']
  const agents: WorkloadData[] = []

  for (let i = 1; i <= 100; i++) {
    const role = roles[i % roles.length]
    const status = statuses[Math.floor(Math.random() * statuses.length)]

    // Vary task distribution - some agents loaded, some idle
    const utilizationRatio = Math.random()
    let activeTasksCount = 0
    let totalEstimatedHours = 0

    if (utilizationRatio < 0.2) {
      // 20% idle agents
      activeTasksCount = 0
      totalEstimatedHours = 0
    } else if (utilizationRatio < 0.5) {
      // 30% lightly loaded
      activeTasksCount = Math.floor(Math.random() * 2) + 1
      totalEstimatedHours = Math.floor(Math.random() * 10) + 5
    } else if (utilizationRatio < 0.8) {
      // 30% normally loaded
      activeTasksCount = Math.floor(Math.random() * 3) + 2
      totalEstimatedHours = Math.floor(Math.random() * 20) + 15
    } else {
      // 20% heavily loaded
      activeTasksCount = Math.floor(Math.random() * 4) + 3
      totalEstimatedHours = Math.floor(Math.random() * 30) + 25
    }

    agents.push({
      agentId: `agent-${i}`,
      role,
      status,
      activeTasksCount,
      totalEstimatedHours,
      sprintCapacity: 40,
      utilizationPercent: Math.round(((totalEstimatedHours / 40) * 100) * 10) / 10,
    })
  }

  return agents
}

// Cache workload data and regenerate periodically
let cachedWorkloads = generateAgentWorkloads()
let lastGeneratedAt = Date.now()

/**
 * Refresh cached workloads every 5 seconds to simulate real-time changes
 * Small variations in task counts and hours as tasks complete/start
 */
function getUpdatedWorkloads(): WorkloadData[] {
  const now = Date.now()
  const timeSinceGeneration = now - lastGeneratedAt

  // Regenerate fresh data every 5 seconds
  if (timeSinceGeneration > 5000) {
    cachedWorkloads = generateAgentWorkloads()
    lastGeneratedAt = now
  }

  // Add small variations to make it feel live
  return cachedWorkloads.map((workload) => {
    // 30% chance of small variation in task counts
    if (Math.random() < 0.3) {
      const variation = Math.floor(Math.random() * 3) - 1 // -1, 0, or +1
      const newTaskCount = Math.max(0, workload.activeTasksCount + variation)
      const newHours = Math.max(0, workload.totalEstimatedHours + variation * 2)

      return {
        ...workload,
        activeTasksCount: newTaskCount,
        totalEstimatedHours: newHours,
        utilizationPercent:
          Math.round(((newHours / workload.sprintCapacity) * 100) * 10) / 10,
      }
    }
    return workload
  })
}

export const workloadHandlers = [
  /**
   * GET /api/agents/workload
   * Get all agents with their current workload metrics
   * Used by WorkloadDashboard for capacity planning
   * Response: WorkloadData[]
   */
  http.get('/api/agents/workload', () => {
    const workloads = getUpdatedWorkloads()

    return HttpResponse.json(workloads, { status: 200 })
  }),

  /**
   * GET /api/agents/:id/workload
   * Get workload details for a single agent
   * Response: WorkloadData
   */
  http.get('/api/agents/:id/workload', ({ params }) => {
    const { id } = params
    const workloads = getUpdatedWorkloads()
    const workload = workloads.find((w) => w.agentId === id)

    if (!workload) {
      return HttpResponse.json(
        { error: 'Agent workload not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(workload, { status: 200 })
  }),
]
