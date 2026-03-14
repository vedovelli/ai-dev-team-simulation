/**
 * MSW Handler for Agent Capacity Dashboard v1
 *
 * Simplified, management-facing agent capacity metrics endpoint.
 * Provides agent workload data with capacity bar visualization.
 *
 * Endpoints:
 * - GET /api/agents/metrics - Get agent capacity metrics for the dashboard
 */

import { http, HttpResponse } from 'msw'
import type { AgentCapacityMetric } from '../../types/capacity'

export interface AgentCapacityMetricsV1Response {
  agents: AgentCapacityMetric[]
  timestamp: string
}

/**
 * Generate realistic agent capacity data
 * Simulates workload distribution across agents
 */
function generateAgentMetrics(): AgentCapacityMetric[] {
  const agentNames = [
    'Alice Chen',
    'Bob Rodriguez',
    'Charlie Williams',
    'Diana Prince',
    'Eve Martinez',
    'Frank Thompson',
    'Grace Lee',
    'Henry Jackson',
    'Ivy Kim',
    'Jack Anderson',
  ]

  const maxCapacity = 10 // Standard 10-task limit

  return agentNames.map((name, index) => {
    const currentLoad = Math.floor(Math.random() * (maxCapacity + 1))
    const utilizationPct = Math.round((currentLoad / maxCapacity) * 100)

    // Determine warning level based on capacity threshold
    let warningLevel: 'ok' | 'warning' | 'critical'
    if (utilizationPct > 80) {
      warningLevel = 'critical' // Map to existing type for compatibility
    } else if (utilizationPct > 60) {
      warningLevel = 'warning'
    } else {
      warningLevel = 'ok'
    }

    return {
      agentId: `agent-${index + 1}`,
      name,
      currentLoad,
      maxCapacity,
      tasksAssigned: currentLoad,
      utilizationPct,
      warningLevel,
    }
  })
}

// Cache for synthetic data (refresh every 30 seconds)
let cachedMetrics: AgentCapacityMetric[] = []
let lastGeneratedAt = 0
const CACHE_TTL = 30000 // 30 seconds

function getCachedMetrics(): AgentCapacityMetric[] {
  const now = Date.now()
  if (now - lastGeneratedAt > CACHE_TTL) {
    cachedMetrics = generateAgentMetrics()
    lastGeneratedAt = now
  }
  return cachedMetrics
}

export const agentCapacityV1Handlers = [
  /**
   * GET /api/agents/metrics
   * Management dashboard endpoint for simplified agent capacity view
   * Returns list of agents with utilization percentages
   */
  http.get('/api/agents/metrics', () => {
    const agents = getCachedMetrics()

    return HttpResponse.json<AgentCapacityMetricsV1Response>(
      {
        agents,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  }),
]
