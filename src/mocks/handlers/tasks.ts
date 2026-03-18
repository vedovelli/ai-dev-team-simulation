/**
 * MSW Handlers for Task Management with Advanced Filtering
 *
 * Endpoints:
 * - GET /api/tasks - List tasks with filtering and cursor-based pagination
 * - PATCH /api/tasks/:id - Update task with version-based conflict detection
 * - GET /api/tasks/:id - Fetch a single task
 *
 * Filtering Support:
 * - Multiple values per parameter (e.g., status=todo&status=in-progress)
 * - Filter dimensions: status, priority, assignee, sprint, agent, dateRange
 * - Cursor-based pagination with nextCursor and hasNextPage metadata
 * - Total count tracking across filter combinations
 *
 * Conflict Simulation:
 * - ~5% chance of returning 409 Conflict when version mismatches
 * - Returns serverVersion in conflict response for UI diffing
 */

import { http, HttpResponse } from 'msw'
import type { Task, TaskStatus, TaskPriority, UpdateTaskInput, PaginatedTasksResponse } from '../../types/task'

/**
 * In-memory store for task versions
 * In production, this would be persisted in database
 */
const taskVersionStore: Record<string, number> = {
  'task-1': 1,
  'task-2': 1,
  'task-3': 1,
  'task-4': 1,
  'task-5': 1,
  'task-6': 1,
  'task-7': 1,
  'task-8': 1,
  'task-9': 1,
  'task-10': 1,
  'task-11': 1,
  'task-12': 1,
  'task-13': 1,
  'task-14': 1,
}

/**
 * Mock task data (matches tableRouter mock data)
 */
const mockTasksData: Record<string, Task> = {
  'task-1': {
    id: 'task-1',
    title: 'Implement authentication',
    assignee: 'agent-1',
    team: 'backend',
    status: 'in-progress',
    priority: 'high',
    storyPoints: 8,
    sprint: 'sprint-1',
    order: 1,
    estimatedHours: 16,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    version: 1,
  },
  'task-2': {
    id: 'task-2',
    title: 'Design database schema',
    assignee: 'agent-2',
    team: 'backend',
    status: 'backlog',
    priority: 'high',
    storyPoints: 13,
    sprint: 'sprint-2',
    order: 2,
    estimatedHours: 24,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    version: 1,
  },
  'task-3': {
    id: 'task-3',
    title: 'API documentation',
    assignee: 'agent-1',
    team: 'platform',
    status: 'done',
    priority: 'medium',
    storyPoints: 5,
    sprint: 'sprint-1',
    order: 3,
    estimatedHours: 8,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    version: 1,
  },
  'task-4': {
    id: 'task-4',
    title: 'Fix login bug',
    assignee: 'agent-3',
    team: 'frontend',
    status: 'in-review',
    priority: 'high',
    storyPoints: 3,
    sprint: 'sprint-1',
    order: 4,
    estimatedHours: 4,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    version: 1,
  },
  'task-5': {
    id: 'task-5',
    title: 'Optimize queries',
    assignee: 'agent-2',
    team: 'backend',
    status: 'backlog',
    priority: 'low',
    storyPoints: 5,
    sprint: 'sprint-3',
    order: 5,
    estimatedHours: 10,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    version: 1,
  },
}

export const taskHandlers = [
  /**
   * GET /api/tasks
   * List tasks with advanced filtering and cursor-based pagination
   * Supports:
   * - Legacy pagination: ?pageIndex=0&pageSize=10
   * - Infinite scroll: ?page=0&limit=20&filters=...
   * - Multi-value filters: ?status=todo&status=in-progress&priority=high
   * - Filter dimensions: status, priority, assignee, sprint, agent, dateRangeStart, dateRangeEnd
   */
  http.get('/api/tasks', ({ request }) => {
    const url = new URL(request.url)

    // Parse multi-value filters
    const parseMultiValue = (key: string): string[] => {
      const values = url.searchParams.getAll(key)
      return values.filter((v) => v)
    }

    const statusFilters = parseMultiValue('status') as TaskStatus[]
    const priorityFilters = parseMultiValue('priority') as TaskPriority[]
    const assigneeFilters = parseMultiValue('assignee')
    const sprintFilters = parseMultiValue('sprint')
    const agentFilters = parseMultiValue('agent')
    const searchQuery = url.searchParams.get('search')?.toLowerCase() || ''
    const dateRangeStart = url.searchParams.get('dateRangeStart') || null
    const dateRangeEnd = url.searchParams.get('dateRangeEnd') || null

    // Detect pagination type: page/limit (infinite scroll) or pageIndex/pageSize (legacy)
    const hasLimitParam = url.searchParams.has('limit')
    const hasPageSizeParam = url.searchParams.has('pageSize')

    let page: number
    let pageSize: number

    if (hasLimitParam) {
      // Infinite scroll: page=0&limit=20
      page = Math.max(0, parseInt(url.searchParams.get('page') || '0', 10))
      pageSize = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '20', 10)))
    } else {
      // Legacy: pageIndex=0&pageSize=10
      const pageIndex = Math.max(0, parseInt(url.searchParams.get('pageIndex') || '0', 10))
      pageSize = Math.max(1, Math.min(100, parseInt(url.searchParams.get('pageSize') || '10', 10)))
      page = pageIndex
    }

    // Filter tasks with AND logic across dimensions, OR logic within dimensions
    let filtered = Object.values(mockTasksData).filter((task) => {
      // Status filter (OR logic within dimension)
      if (statusFilters.length > 0 && !statusFilters.includes(task.status)) {
        return false
      }

      // Priority filter (OR logic within dimension)
      if (priorityFilters.length > 0 && !priorityFilters.includes(task.priority)) {
        return false
      }

      // Assignee filter (OR logic within dimension)
      if (assigneeFilters.length > 0 && !assigneeFilters.includes(task.assignee)) {
        return false
      }

      // Sprint filter (OR logic within dimension)
      if (sprintFilters.length > 0 && !sprintFilters.includes(task.sprint)) {
        return false
      }

      // Agent filter (OR logic within dimension)
      // Note: 'agent' filter checks task.assignee (agents are assignees in this domain)
      if (agentFilters.length > 0 && !agentFilters.includes(task.assignee)) {
        return false
      }

      // Date range filter (AND logic across start/end)
      // Validate date strings to avoid silent filtering with Invalid Date objects
      const isValidDateString = (dateStr: string | null): dateStr is string => {
        if (!dateStr) return false
        const date = new Date(dateStr)
        return !Number.isNaN(date.getTime())
      }

      if (dateRangeStart && isValidDateString(dateRangeStart)) {
        const start = new Date(dateRangeStart)
        const taskDeadline = task.deadline ? new Date(task.deadline) : null
        if (!taskDeadline || taskDeadline < start) {
          return false
        }
      }
      if (dateRangeEnd && isValidDateString(dateRangeEnd)) {
        const end = new Date(dateRangeEnd)
        const taskDeadline = task.deadline ? new Date(task.deadline) : null
        if (!taskDeadline || taskDeadline > end) {
          return false
        }
      }

      // Search filter (full-text across title)
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery)) {
        return false
      }

      return true
    })

    // Pagination with cursor support
    const total = filtered.length
    const startIdx = page * pageSize
    const endIdx = startIdx + pageSize
    const paginatedTasks = filtered.slice(startIdx, endIdx)
    const hasNextPage = endIdx < total

    // Return format depends on pagination type
    if (hasLimitParam) {
      // Infinite scroll response format
      const response: PaginatedTasksResponse = {
        data: paginatedTasks,
        totalCount: total,
        pageSize,
        nextCursor: hasNextPage ? page + 1 : null,
        hasNextPage,
      }
      return HttpResponse.json(response)
    }

    // Legacy response format
    const totalPages = Math.ceil(total / pageSize)
    return HttpResponse.json({
      data: paginatedTasks,
      total,
      page: page + 1,
      pageSize,
      totalPages,
    })
  }),

  /**
   * PATCH /api/tasks/:id
   * Update a task with version-based conflict detection
   */
  http.patch('/api/tasks/:id', async ({ params, request }) => {
    try {
      const { id } = params
      const body = (await request.json()) as UpdateTaskInput & { version?: number }

      const task = mockTasksData[id as keyof typeof mockTasksData]
      if (!task) {
        return HttpResponse.json({ error: 'Task not found' }, { status: 404 })
      }

      // Check version if provided (conflict detection)
      if (body.version !== undefined) {
        const serverVersion = taskVersionStore[id as keyof typeof taskVersionStore] || 1

        // Simulate ~5% conflict rate when version mismatches
        if (body.version !== serverVersion && Math.random() < 0.05) {
          return HttpResponse.json(
            {
              error: 'conflict',
              serverVersion: {
                ...task,
                version: serverVersion,
              },
            },
            { status: 409 }
          )
        }

        // Check actual version match
        if (body.version !== serverVersion) {
          return HttpResponse.json(
            {
              error: 'conflict',
              serverVersion: {
                ...task,
                version: serverVersion,
              },
            },
            { status: 409 }
          )
        }
      }

      // Update task
      const updatedTask: Task = {
        ...task,
        ...body,
        version: (task.version || 1) + 1,
        updatedAt: new Date().toISOString(),
      }

      // Increment version in store
      taskVersionStore[id as keyof typeof taskVersionStore] = updatedTask.version

      // Update in mock data
      mockTasksData[id as keyof typeof mockTasksData] = updatedTask

      // Return updated task with X-Resource-Version header
      return HttpResponse.json(updatedTask, {
        headers: {
          'X-Resource-Version': String(updatedTask.version),
        },
      })
    } catch (error) {
      return HttpResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
  }),

  /**
   * GET /api/tasks/:id
   * Fetch a single task with version header
   */
  http.get('/api/tasks/:id', ({ params }) => {
    const { id } = params
    const task = mockTasksData[id as keyof typeof mockTasksData]

    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return HttpResponse.json(task, {
      headers: {
        'X-Resource-Version': String(task.version),
      },
    })
  }),
]
