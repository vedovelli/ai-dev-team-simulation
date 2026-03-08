/**
 * MSW Handlers for Agent Management Dashboard
 *
 * Mock API endpoints for agent lifecycle management:
 * - List all agents with filtering and search
 * - Get single agent details with stats
 * - Create new agent with validation
 * - Update existing agent (partial updates)
 * - Soft delete agent (validates no active tasks)
 */

import { http, HttpResponse } from 'msw'
import type { AgentManagement, AgentStats } from '../../types/agent'

/**
 * In-memory store for managed agents
 * Maintains state across requests for realistic behavior
 */
const agentsStore = new Map<string, AgentManagement & { deletedAt?: string }>()

/**
 * Generate initial mock agents with realistic stats
 */
function initializeAgents() {
  const capabilities = [
    ['code-review', 'refactoring', 'architecture'],
    ['feature-implementation', 'testing', 'debugging'],
    ['api-design', 'database-optimization', 'infrastructure'],
    ['frontend-development', 'ui-optimization', 'accessibility'],
    ['documentation', 'planning', 'team-coordination'],
    ['devops', 'ci-cd', 'monitoring'],
    ['bug-fixes', 'performance-tuning', 'code-review'],
    ['testing', 'automation', 'qa-strategy'],
  ]

  const agentNames = [
    'Alice',
    'Bob',
    'Charlie',
    'Diana',
    'Eve',
    'Frank',
    'Grace',
    'Henry',
  ]

  const now = new Date()

  for (let i = 0; i < 8; i++) {
    const agentId = `agent-mgmt-${i + 1}`
    agentsStore.set(agentId, {
      id: agentId,
      name: agentNames[i],
      capabilities: capabilities[i],
      status: ['active', 'idle', 'busy', 'offline'][Math.floor(Math.random() * 4)] as 'active' | 'idle' | 'busy' | 'offline',
      rateLimit: Math.random() > 0.5 ? { requestsPerMinute: 100 } : undefined,
      taskCount: Math.floor(Math.random() * 10) + 1,
      successRate: Math.round((Math.random() * 40 + 60) * 100) / 100, // 60-100%
      createdAt: new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    })
  }
}

// Initialize on module load
initializeAgents()

/**
 * Validate agent uniqueness by name (case-insensitive)
 */
function isNameUnique(name: string, excludeId?: string): boolean {
  for (const agent of agentsStore.values()) {
    if (!agent.deletedAt && agent.name.toLowerCase() === name.toLowerCase() && agent.id !== excludeId) {
      return false
    }
  }
  return true
}

/**
 * Get active agents only (not soft-deleted)
 */
function getActiveAgents(): Array<AgentManagement & { deletedAt?: string }> {
  return Array.from(agentsStore.values()).filter((a) => !a.deletedAt)
}

/**
 * Generate realistic task stats for an agent
 */
function generateAgentStats(agent: AgentManagement): AgentStats {
  return {
    currentTasks: Math.floor(Math.random() * 5) + 1,
    completedTasks: Math.floor(Math.random() * 50) + 10,
    successRate: agent.successRate,
    avgCompletionTime: Math.floor(Math.random() * 480) + 120, // 2-8 hours in minutes
  }
}

/**
 * Generate workload analytics for agents
 */
function generateWorkloadAnalytics(agent: AgentManagement) {
  const completionRate = agent.successRate || 75
  const completedTasks7d = Math.floor(Math.random() * 15) + 5
  const completedTasks30d = Math.floor(Math.random() * 60) + 20
  const avgCompletionHours = Math.floor(Math.random() * 6) + 2

  return {
    agentId: agent.id,
    name: agent.name,
    activeTasksCount: agent.taskCount || 0,
    completedTasks: completedTasks30d,
    averageCompletionTime: avgCompletionHours,
    capacityUtilization: Math.min(100, (agent.taskCount || 0) * 12),
    skillTags: agent.capabilities || [],
    completionTrend: (Math.random() - 0.3) * 30,
    status:
      agent.taskCount && agent.taskCount > 8
        ? 'overloaded'
        : agent.taskCount && agent.taskCount > 5
          ? 'busy'
          : 'available',
  }
}

export const agentManagementHandlers = [
  /**
   * GET /api/agents/workload
   * Get workload analytics for all agents
   */
  http.get('/api/agents/workload', ({ request }) => {
    const url = new URL(request.url)
    const skillTag = url.searchParams.get('skillTag')
    const status = url.searchParams.get('status')

    let agents = getActiveAgents()

    // Filter by skill tag if provided
    if (skillTag) {
      agents = agents.filter((agent) => agent.capabilities.includes(skillTag))
    }

    const workloadData = agents.map(generateWorkloadAnalytics)

    // Filter by status if provided
    let result = workloadData
    if (status) {
      result = workloadData.filter((w) => w.status === status)
    }

    return HttpResponse.json(result)
  }),

  /**
   * GET /api/agents/:id/workload
   * Get workload analytics for a single agent
   */
  http.get('/api/agents/:id/workload', ({ params }) => {
    const { id } = params
    const agent = agentsStore.get(id as string)

    if (!agent || agent.deletedAt) {
      return HttpResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return HttpResponse.json(generateWorkloadAnalytics(agent))
  }),

  /**
   * GET /api/agents
   * List all agents with query support
   * Query params: search, status, sortBy, order
   * Response: { agents: AgentManagement[], total: number }
   */
  http.get('/api/agents', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || ''
    const sortBy = url.searchParams.get('sortBy') || 'name'
    const order = url.searchParams.get('order') || 'asc'

    let agents = getActiveAgents()

    // Filter by search (name or capabilities)
    if (search) {
      const searchLower = search.toLowerCase()
      agents = agents.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchLower) ||
          agent.capabilities.some((cap) => cap.toLowerCase().includes(searchLower))
      )
    }

    // Filter by status
    if (status) {
      agents = agents.filter((agent) => agent.status === status)
    }

    // Sort
    const validSortFields = ['name', 'status', 'taskCount', 'successRate', 'createdAt', 'updatedAt']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name'

    agents.sort((a, b) => {
      const aValue = a[sortField as keyof AgentManagement]
      const bValue = b[sortField as keyof AgentManagement]

      let comparison = 0
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      }

      return order === 'desc' ? -comparison : comparison
    })

    return HttpResponse.json({
      agents: agents as AgentManagement[],
      total: agents.length,
    })
  }),

  /**
   * GET /api/agents/:id
   * Get agent details with task stats
   */
  http.get('/api/agents/:id', ({ params }) => {
    const { id } = params
    const agent = agentsStore.get(id as string)

    if (!agent || agent.deletedAt) {
      return HttpResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const stats = generateAgentStats(agent)

    return HttpResponse.json({
      ...agent,
      stats,
    })
  }),

  /**
   * POST /api/agents
   * Create new agent
   * Validates: name (required, unique), capabilities (array), rateLimit (optional)
   */
  http.post('/api/agents', async ({ request }) => {
    const body = (await request.json()) as {
      name: string
      capabilities: string[]
      rateLimit?: { requestsPerMinute: number }
    }

    // Validate name
    if (!body.name || body.name.trim() === '') {
      return HttpResponse.json({ error: 'Agent name is required' }, { status: 400 })
    }

    if (!isNameUnique(body.name)) {
      return HttpResponse.json({ error: `Agent with name "${body.name}" already exists` }, { status: 400 })
    }

    // Validate capabilities
    if (!Array.isArray(body.capabilities)) {
      return HttpResponse.json({ error: 'Capabilities must be an array' }, { status: 400 })
    }

    const newAgent: AgentManagement = {
      id: `agent-mgmt-${Date.now()}`,
      name: body.name,
      capabilities: body.capabilities,
      status: 'idle',
      rateLimit: body.rateLimit,
      taskCount: 0,
      successRate: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    agentsStore.set(newAgent.id, newAgent)

    return HttpResponse.json(newAgent, { status: 201 })
  }),

  /**
   * PUT /api/agents/:id
   * Update agent (partial updates)
   */
  http.put('/api/agents/:id', async ({ request, params }) => {
    const { id } = params
    const agent = agentsStore.get(id as string)

    if (!agent || agent.deletedAt) {
      return HttpResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const body = (await request.json()) as Partial<
      Omit<AgentManagement, 'id' | 'createdAt'>
    >

    // Validate name uniqueness if updating name
    if (body.name && !isNameUnique(body.name, id as string)) {
      return HttpResponse.json({ error: `Agent with name "${body.name}" already exists` }, { status: 400 })
    }

    // Validate capabilities if provided
    if (body.capabilities && !Array.isArray(body.capabilities)) {
      return HttpResponse.json({ error: 'Capabilities must be an array' }, { status: 400 })
    }

    const updatedAgent: AgentManagement = {
      ...agent,
      ...body,
      id: agent.id,
      createdAt: agent.createdAt,
      updatedAt: new Date().toISOString(),
    }

    agentsStore.set(id as string, updatedAgent)

    return HttpResponse.json(updatedAgent)
  }),

  /**
   * DELETE /api/agents/:id
   * Soft delete agent
   * Validates: no active tasks assigned
   */
  http.delete('/api/agents/:id', ({ params }) => {
    const { id } = params
    const agent = agentsStore.get(id as string)

    if (!agent || agent.deletedAt) {
      return HttpResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Check if agent has active tasks
    if (agent.taskCount > 0) {
      return HttpResponse.json(
        { error: 'Cannot delete agent with active tasks' },
        { status: 400 }
      )
    }

    // Soft delete
    const deletedAgent = {
      ...agent,
      deletedAt: new Date().toISOString(),
    }

    agentsStore.set(id as string, deletedAgent)

    return HttpResponse.json({ success: true, message: 'Agent deleted' })
  }),
]
