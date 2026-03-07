import { http, HttpResponse } from 'msw'
import type { Task } from '../../types/task'
import type { Agent } from '../../types/agent'

// Mock data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Implement user authentication',
    assignee: 'agent-1',
    team: 'platform',
    status: 'in-progress',
    priority: 'high',
    storyPoints: 8,
    sprint: 'sprint-1',
    order: 1,
    estimatedHours: 16,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'Add password reset functionality',
    assignee: 'agent-2',
    team: 'platform',
    status: 'backlog',
    priority: 'high',
    storyPoints: 5,
    sprint: 'sprint-1',
    order: 2,
    estimatedHours: 10,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Create task assignment UI',
    assignee: '',
    team: 'frontend',
    status: 'backlog',
    priority: 'medium',
    storyPoints: 5,
    sprint: 'sprint-2',
    order: 3,
    estimatedHours: 8,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'Implement queue system',
    assignee: 'agent-1',
    team: 'backend',
    status: 'in-progress',
    priority: 'high',
    storyPoints: 13,
    sprint: 'sprint-1',
    order: 4,
    estimatedHours: 24,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    title: 'Database schema design',
    assignee: '',
    team: 'backend',
    status: 'backlog',
    priority: 'medium',
    storyPoints: 3,
    sprint: 'sprint-1',
    order: 5,
    estimatedHours: 4,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    title: 'Write integration tests',
    assignee: 'agent-3',
    team: 'qa',
    status: 'in-review',
    priority: 'medium',
    storyPoints: 5,
    sprint: 'sprint-1',
    order: 6,
    estimatedHours: 10,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    title: 'Fix production bug',
    assignee: 'agent-2',
    team: 'platform',
    status: 'done',
    priority: 'high',
    storyPoints: 2,
    sprint: 'sprint-1',
    order: 7,
    estimatedHours: 3,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '8',
    title: 'Performance optimization',
    assignee: '',
    team: 'infrastructure',
    status: 'backlog',
    priority: 'low',
    storyPoints: 8,
    sprint: 'sprint-2',
    order: 8,
    estimatedHours: 16,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Carlos',
    role: 'sr-dev',
    status: 'working',
    currentTask: '1',
    output: 'Implementing authentication flow',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'agent-2',
    name: 'Ana',
    role: 'junior',
    status: 'working',
    currentTask: '2',
    output: 'Working on password reset',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'agent-3',
    name: 'Marcus',
    role: 'pm',
    status: 'idle',
    currentTask: '',
    output: 'Available for assignment',
    lastUpdated: new Date().toISOString(),
  },
]

interface AssignmentPayload {
  agentId: string
}

interface BulkAssignmentPayload {
  taskIds: string[]
  agentId: string
}

interface AvailabilityResponse {
  [agentId: string]: {
    currentTasks: number
    maxTasks: number
    workload: 'low' | 'medium' | 'high' | 'overloaded'
  }
}

/**
 * MSW handlers for task queue operations.
 * Demonstrates:
 * - Fetching filtered task queue
 * - Individual task assignment with validation
 * - Bulk assignment operations
 * - Agent availability checking
 */
export const taskQueueHandlers = [
  // GET /api/tasks/queue - Fetch task queue with filters
  http.get('/api/tasks/queue', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const assignee = url.searchParams.get('assignee')
    const sprint = url.searchParams.get('sprint')

    let filtered = [...mockTasks]

    if (status) {
      filtered = filtered.filter((t) => t.status === status)
    }
    if (assignee && assignee !== 'unassigned') {
      filtered = filtered.filter((t) => t.assignee === assignee)
    }
    if (assignee === 'unassigned') {
      filtered = filtered.filter((t) => !t.assignee)
    }
    if (sprint) {
      filtered = filtered.filter((t) => t.sprint === sprint)
    }

    return HttpResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
    })
  }),

  // POST /api/tasks/:id/assign - Assign task to agent
  http.post('/api/tasks/:id/assign', async ({ params, request }) => {
    const { id } = params
    const { agentId } = (await request.json()) as AssignmentPayload

    // Find task and agent
    const task = mockTasks.find((t) => t.id === id)
    const agent = mockAgents.find((a) => a.id === agentId)

    if (!task) {
      return HttpResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    if (!agent) {
      return HttpResponse.json({ success: false, error: 'Agent not found' }, { status: 404 })
    }

    // Mock validation: check workload limits
    const agentTaskCount = mockTasks.filter(
      (t) => t.assignee === agentId && t.status !== 'done'
    ).length

    if (agentTaskCount >= 10) {
      return HttpResponse.json(
        {
          success: false,
          error: `Agent ${agent.name} is at maximum capacity`,
        },
        { status: 400 }
      )
    }

    // Mock skill matching validation
    if (task.priority === 'high' && agent.role === 'junior') {
      // Allow but warn
      console.warn(`Low-skill agent assigned to high-priority task`)
    }

    // Update mock data
    task.assignee = agentId
    task.updatedAt = new Date().toISOString()

    return HttpResponse.json({
      success: true,
      data: task,
      message: `Task assigned to ${agent.name}`,
    })
  }),

  // POST /api/tasks/assign-bulk - Bulk assignment
  http.post('/api/tasks/assign-bulk', async ({ request }) => {
    const { taskIds, agentId } = (await request.json()) as BulkAssignmentPayload

    const agent = mockAgents.find((a) => a.id === agentId)

    if (!agent) {
      return HttpResponse.json({ success: false, error: 'Agent not found' }, { status: 404 })
    }

    // Check workload
    const currentCount = mockTasks.filter(
      (t) => t.assignee === agentId && t.status !== 'done'
    ).length
    const totalAfter = currentCount + taskIds.length

    if (totalAfter > 10) {
      return HttpResponse.json(
        {
          success: false,
          error: `Cannot assign ${taskIds.length} tasks: would exceed capacity`,
        },
        { status: 400 }
      )
    }

    // Assign all tasks
    const assignedTasks: Task[] = []
    for (const taskId of taskIds) {
      const task = mockTasks.find((t) => t.id === taskId)
      if (task) {
        task.assignee = agentId
        task.updatedAt = new Date().toISOString()
        assignedTasks.push(task)
      }
    }

    return HttpResponse.json({
      success: true,
      data: assignedTasks,
      message: `${assignedTasks.length} tasks assigned to ${agent.name}`,
    })
  }),

  // GET /api/agents/availability - Check agent workload
  http.get('/api/agents/availability', () => {
    const availability: AvailabilityResponse = {}

    for (const agent of mockAgents) {
      const agentTasks = mockTasks.filter(
        (t) => t.assignee === agent.id && t.status !== 'done'
      )
      const currentTasks = agentTasks.length
      const maxTasks = 10
      const utilization = currentTasks / maxTasks

      let workload: 'low' | 'medium' | 'high' | 'overloaded'
      if (utilization > 1) {
        workload = 'overloaded'
      } else if (utilization > 0.75) {
        workload = 'high'
      } else if (utilization > 0.4) {
        workload = 'medium'
      } else {
        workload = 'low'
      }

      availability[agent.id] = {
        currentTasks,
        maxTasks,
        workload,
      }
    }

    return HttpResponse.json({
      success: true,
      data: availability,
    })
  }),
]
