import { http, HttpResponse } from 'msw'
import type { Task } from '../../types/task'

// Mock data - agent task queue with pagination support
const mockAgentTasks: Task[] = [
  {
    id: 'agent-task-1',
    title: 'Analyze AI model performance metrics',
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
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'agent-task-2',
    title: 'Implement agent communication protocol',
    assignee: 'agent-1',
    team: 'backend',
    status: 'in-progress',
    priority: 'high',
    storyPoints: 13,
    sprint: 'sprint-1',
    order: 2,
    estimatedHours: 24,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'agent-task-3',
    title: 'Review code changes from junior agent',
    assignee: 'agent-1',
    team: 'platform',
    status: 'in-review',
    priority: 'medium',
    storyPoints: 5,
    sprint: 'sprint-1',
    order: 3,
    estimatedHours: 4,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'agent-task-4',
    title: 'Design database schema for agent tasks',
    assignee: 'agent-1',
    team: 'backend',
    status: 'backlog',
    priority: 'high',
    storyPoints: 8,
    sprint: 'sprint-2',
    order: 4,
    estimatedHours: 12,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'agent-task-5',
    title: 'Write integration tests for task queue',
    assignee: 'agent-2',
    team: 'qa',
    status: 'backlog',
    priority: 'medium',
    storyPoints: 5,
    sprint: 'sprint-1',
    order: 5,
    estimatedHours: 10,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'agent-task-6',
    title: 'Optimize query performance',
    assignee: 'agent-1',
    team: 'infrastructure',
    status: 'done',
    priority: 'medium',
    storyPoints: 3,
    sprint: 'sprint-1',
    order: 6,
    estimatedHours: 6,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'agent-task-7',
    title: 'Deploy agent service to production',
    assignee: 'agent-3',
    team: 'devops',
    status: 'in-progress',
    priority: 'high',
    storyPoints: 5,
    sprint: 'sprint-1',
    order: 7,
    estimatedHours: 8,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'agent-task-8',
    title: 'Document API endpoints',
    assignee: 'agent-2',
    team: 'docs',
    status: 'backlog',
    priority: 'low',
    storyPoints: 3,
    sprint: 'sprint-2',
    order: 8,
    estimatedHours: 4,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'agent-task-9',
    title: 'Fix security vulnerabilities',
    assignee: 'agent-1',
    team: 'security',
    status: 'in-progress',
    priority: 'high',
    storyPoints: 8,
    sprint: 'sprint-1',
    order: 9,
    estimatedHours: 16,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'agent-task-10',
    title: 'Set up monitoring and alerting',
    assignee: 'agent-3',
    team: 'infrastructure',
    status: 'in-progress',
    priority: 'medium',
    storyPoints: 5,
    sprint: 'sprint-1',
    order: 10,
    estimatedHours: 8,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
]

interface PaginationParams {
  page: number
  limit: number
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * MSW handlers for agent task queue operations.
 * Demonstrates:
 * - Paginated task list fetching with filtering and sorting
 * - Task detail retrieval
 * - Status updates with optimistic update support
 */
export const agentTaskQueueHandlers = [
  // GET /api/tasks - Paginated task list with filters and sorting
  http.get('/api/tasks', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const status = url.searchParams.get('status')
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    let filtered = [...mockAgentTasks]

    // Apply status filter if provided
    if (status) {
      filtered = filtered.filter((t) => t.status === status)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof Task]
      const bVal = b[sortBy as keyof Task]

      if (aVal == null && bVal == null) return 0
      if (aVal == null) return sortOrder === 'asc' ? 1 : -1
      if (bVal == null) return sortOrder === 'asc' ? -1 : 1

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      }

      return 0
    })

    // Apply pagination
    const total = filtered.length
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedData = filtered.slice(start, end)

    return HttpResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  }),

  // GET /api/tasks/:id - Fetch task details
  http.get('/api/tasks/:id', ({ params }) => {
    const { id } = params
    const task = mockAgentTasks.find((t) => t.id === id)

    if (!task) {
      return HttpResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    return HttpResponse.json({
      success: true,
      data: task,
    })
  }),

  // PATCH /api/tasks/:id/status - Update task status with optimistic update support
  http.patch('/api/tasks/:id/status', async ({ params, request }) => {
    const { id } = params
    const { status } = (await request.json()) as { status: string }

    const task = mockAgentTasks.find((t) => t.id === id)

    if (!task) {
      return HttpResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    // Validate status
    const validStatuses = ['backlog', 'in-progress', 'in-review', 'done']
    if (!validStatuses.includes(status)) {
      return HttpResponse.json(
        { success: false, error: `Invalid status: ${status}` },
        { status: 400 }
      )
    }

    // Update task
    task.status = status as any
    task.updatedAt = new Date().toISOString()

    return HttpResponse.json({
      success: true,
      data: task,
      message: `Task status updated to ${status}`,
    })
  }),
]
