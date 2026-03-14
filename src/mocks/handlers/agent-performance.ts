/**
 * MSW Handlers for Agent Performance Analytics
 *
 * Mock API endpoints for per-agent KPIs and performance metrics.
 * Provides realistic, varied performance data across different agents.
 */

import { http, HttpResponse } from 'msw'
import type { AgentPerformance } from '../../types/agent-performance'

/**
 * Generate realistic agent performance data with variation
 * Each agent has different performance characteristics
 */
function generateAgentPerformance(agentId: string): AgentPerformance {
  // Predefined performance profiles for consistency
  const performanceProfiles: Record<string, Omit<AgentPerformance, 'agentId' | 'updatedAt'>> = {
    'alice': {
      tasksCompleted: 45,
      velocity: 3.2,
      onTimeRate: 92,
      avgCompletionDays: 2.1,
    },
    'bob': {
      tasksCompleted: 38,
      velocity: 2.7,
      onTimeRate: 85,
      avgCompletionDays: 2.8,
    },
    'carol': {
      tasksCompleted: 52,
      velocity: 3.8,
      onTimeRate: 95,
      avgCompletionDays: 1.9,
    },
    'david': {
      tasksCompleted: 31,
      velocity: 2.1,
      onTimeRate: 78,
      avgCompletionDays: 3.4,
    },
    'eve': {
      tasksCompleted: 42,
      velocity: 3.0,
      onTimeRate: 88,
      avgCompletionDays: 2.5,
    },
  }

  const profile = performanceProfiles[agentId] || {
    tasksCompleted: Math.floor(Math.random() * 60) + 20,
    velocity: Math.random() * 2 + 2,
    onTimeRate: Math.floor(Math.random() * 30) + 70,
    avgCompletionDays: Math.random() * 2 + 2,
  }

  return {
    agentId,
    ...profile,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * MSW handlers for agent performance endpoints
 */
export const agentPerformanceHandlers = [
  /**
   * GET /api/agents/:agentId/performance
   * Returns performance KPIs for a specific agent
   */
  http.get('/api/agents/:agentId/performance', ({ params }) => {
    const { agentId } = params

    if (!agentId) {
      return HttpResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    return HttpResponse.json<AgentPerformance>(
      generateAgentPerformance(agentId as string),
      { status: 200 }
    )
  }),
]
