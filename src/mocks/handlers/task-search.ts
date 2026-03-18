/**
 * MSW Handler for Task Search & Advanced Filtering
 *
 * Implements:
 * - GET /api/tasks/search — legacy endpoint with faceted filtering
 * - POST /api/tasks/search — new global search with structured filters
 * - GET /api/search/saved-filters — retrieve saved filter sets
 * - POST /api/search/saved-filters — save a new filter set
 * - PATCH /api/search/saved-filters/:id — update saved filter
 * - DELETE /api/search/saved-filters/:id — delete saved filter
 * - POST /api/search/saved-filters/reset — reset all saved filters
 */

import { http, HttpResponse } from 'msw'
import type { TaskStatus, TaskPriority } from '../../types/task'
import type { TaskSearchResponse, SearchTask } from '../../types/task-search'
import type { SearchFilters, SearchResult, SearchResponse, SavedFilter, SaveFilterRequest } from '../../types/search'

// Generate mock tasks with descriptions for search
function generateSearchMockTasks(): SearchTask[] {
  const statuses: TaskStatus[] = ['backlog', 'in-progress', 'in-review', 'done']
  const priorities: TaskPriority[] = ['low', 'medium', 'high']
  const agents = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Charlie Brown', 'Diana Prince']
  const sprints = ['sprint-1', 'sprint-2', 'sprint-3', 'sprint-4']

  const taskTitles = [
    'Implement authentication system',
    'Create API documentation',
    'Fix login form validation',
    'Setup database migrations',
    'Design dashboard components',
    'Write unit tests for services',
    'Optimize database queries',
    'Implement caching layer',
    'Setup CI/CD pipeline',
    'Create user onboarding flow',
    'Fix reported security bugs',
    'Update dependencies',
    'Refactor legacy code',
    'Implement dark mode',
    'Add analytics tracking',
    'Create mobile responsive design',
    'Setup monitoring and alerts',
    'Implement search functionality',
    'Add multi-language support',
    'Create admin dashboard',
  ]

  const descriptions = [
    'Build a robust JWT-based authentication with refresh tokens and role-based access control',
    'Write comprehensive API documentation with examples and error codes for all endpoints',
    'Fix validation errors in login form, add error messages and field highlighting',
    'Create migration scripts for database schema updates and data transformations',
    'Design reusable dashboard components with charts, tables, and widgets',
    'Write comprehensive test coverage for all service methods and edge cases',
    'Analyze and optimize slow database queries using indices and query optimization',
    'Implement Redis caching layer for frequently accessed data and API responses',
    'Setup GitHub Actions CI/CD pipeline with testing, linting, and deployment',
    'Create guided onboarding flow for new users with tutorial and feature discovery',
    'Review security audit findings and implement fixes for vulnerabilities',
    'Update all npm dependencies to latest versions and check compatibility',
    'Refactor legacy authentication code to use modern patterns and standards',
    'Implement dark mode toggle with theme switching and persistence',
    'Add Google Analytics and custom event tracking for user behavior',
    'Make application responsive on mobile devices with proper touch interactions',
    'Setup Prometheus monitoring and alerting for system health metrics',
    'Implement full-text search across tasks and projects with filters',
    'Add i18n support for multiple languages in UI and API responses',
    'Create admin panel for user management, logs, and system configuration',
  ]

  const tasks: SearchTask[] = []
  for (let i = 1; i <= 100; i++) {
    tasks.push({
      id: `task-${i}`,
      title: `${taskTitles[i % taskTitles.length]} #${i}`,
      description: descriptions[i % descriptions.length],
      assignee: agents[i % agents.length],
      status: statuses[i % statuses.length],
      priority: priorities[i % priorities.length],
      sprint: sprints[i % sprints.length],
      matchedFields: [],
    })
  }

  return tasks
}

// In-memory store for saved filters
const savedFiltersStore = new Map<string, SavedFilter>()

const mockTasks = generateSearchMockTasks()

interface SearchParams {
  q?: string
  priority?: string[]
  status?: string[]
  assignedAgent?: string[]
  sprint?: string[]
  deadlineFrom?: string
  deadlineTo?: string
  page?: number
  perPage?: number
}

/**
 * Calculate facet aggregation for filtered results
 */
function calculateFacets(tasks: SearchTask[]) {
  const facets = {
    priority: { low: 0, medium: 0, high: 0 },
    status: { backlog: 0, 'in-progress': 0, 'in-review': 0, done: 0 },
    assignedAgent: {} as Record<string, number>,
    sprint: {} as Record<string, number>,
  }

  tasks.forEach((task) => {
    facets.priority[task.priority]++
    facets.status[task.status]++
    facets.assignedAgent[task.assignee] = (facets.assignedAgent[task.assignee] || 0) + 1
    facets.sprint[task.sprint] = (facets.sprint[task.sprint] || 0) + 1
  })

  return facets
}

/**
 * Search tasks with full-text and filter support
 */
function searchTasks(params: SearchParams) {
  let results = [...mockTasks]

  // Full-text search across title and description
  if (params.q && params.q.trim()) {
    const searchLower = params.q.toLowerCase()
    results = results
      .map((task) => {
        const matched: SearchTask = { ...task, matchedFields: [] }

        if (task.title.toLowerCase().includes(searchLower)) {
          matched.matchedFields.push('title')
        }
        if (task.description.toLowerCase().includes(searchLower)) {
          matched.matchedFields.push('description')
        }

        // Only include if matched
        return matched.matchedFields.length > 0 ? matched : null
      })
      .filter((task) => task !== null) as SearchTask[]
  }

  // Filter by priority (multi-select)
  if (params.priority && params.priority.length > 0) {
    results = results.filter((task) => params.priority!.includes(task.priority))
  }

  // Filter by status (multi-select)
  if (params.status && params.status.length > 0) {
    results = results.filter((task) => params.status!.includes(task.status))
  }

  // Filter by assigned agent (multi-select)
  if (params.assignedAgent && params.assignedAgent.length > 0) {
    results = results.filter((task) => params.assignedAgent!.includes(task.assignee))
  }

  // Filter by sprint (multi-select)
  if (params.sprint && params.sprint.length > 0) {
    results = results.filter((task) => params.sprint!.includes(task.sprint))
  }

  // Filter by deadline date range
  if (params.deadlineFrom || params.deadlineTo) {
    results = results.filter((task) => {
      if (!task.deadline) return false
      const taskDate = new Date(task.deadline).getTime()
      if (params.deadlineFrom) {
        const fromDate = new Date(params.deadlineFrom).getTime()
        if (taskDate < fromDate) return false
      }
      if (params.deadlineTo) {
        const toDate = new Date(params.deadlineTo).getTime()
        if (taskDate > toDate) return false
      }
      return true
    })
  }

  // Calculate facets before pagination
  const facets = calculateFacets(results)

  // Pagination
  const page = Math.max(1, params.page || 1)
  const perPage = Math.max(1, Math.min(100, params.perPage || 20))
  const total = results.length
  const totalPages = Math.ceil(total / perPage)
  const startIdx = (page - 1) * perPage
  const endIdx = startIdx + perPage

  return {
    results: results.slice(startIdx, endIdx),
    facets,
    pagination: {
      page,
      perPage,
      total,
      totalPages,
    },
  }
}

/**
 * Search tasks with POST endpoint for structured filter support
 */
function searchWithFilters(filters: SearchFilters, page: number = 1, pageSize: number = 20) {
  let results = [...mockTasks]

  // Full-text search across title and description
  if (filters.query && filters.query.trim()) {
    const searchLower = filters.query.toLowerCase()
    results = results.filter((task) =>
      task.title.toLowerCase().includes(searchLower) ||
      task.description.toLowerCase().includes(searchLower) ||
      task.id.toLowerCase().includes(searchLower)
    )
  }

  // Filter by status (multi-select)
  if (filters.status && filters.status.length > 0) {
    results = results.filter((task) => filters.status!.includes(task.status))
  }

  // Filter by priority (multi-select)
  if (filters.priority && filters.priority.length > 0) {
    results = results.filter((task) => filters.priority!.includes(task.priority))
  }

  // Filter by agent (multi-select)
  if (filters.agentId && filters.agentId.length > 0) {
    results = results.filter((task) => filters.agentId!.includes(task.assignee))
  }

  // Filter by sprint (multi-select)
  if (filters.sprintId && filters.sprintId.length > 0) {
    results = results.filter((task) => filters.sprintId!.includes(task.sprint))
  }

  // Filter by deadline date range
  if (filters.dateRange) {
    const { from, to } = filters.dateRange
    results = results.filter((task) => {
      if (!from && !to) return true
      if (!task.deadline) return false

      const taskDate = new Date(task.deadline).getTime()
      if (from) {
        const fromDate = new Date(from).getTime()
        if (taskDate < fromDate) return false
      }
      if (to) {
        const toDate = new Date(to).getTime()
        if (taskDate > toDate) return false
      }
      return true
    })
  }

  // Pagination
  const actualPage = Math.max(1, page)
  const actualPageSize = Math.max(1, Math.min(100, pageSize))
  const total = results.length
  const totalPages = Math.ceil(total / actualPageSize)
  const startIdx = (actualPage - 1) * actualPageSize
  const endIdx = startIdx + actualPageSize

  // Convert SearchTask to SearchResult
  const items: SearchResult[] = results.slice(startIdx, endIdx).map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    assignee: task.assignee,
    agentId: task.assignee, // Using assignee as agentId
    status: task.status,
    priority: task.priority,
    sprint: task.sprint,
    sprintId: task.sprint, // Using sprint as sprintId
    createdAt: new Date().toISOString(),
  }))

  return {
    items,
    pagination: {
      page: actualPage,
      pageSize: actualPageSize,
      total,
      totalPages,
    },
  }
}

/**
 * Generate unique ID for saved filters
 */
function generateId() {
  return `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const taskSearchHandlers = [
  // Legacy GET endpoint for backward compatibility
  http.get('/api/tasks/search', ({ request }) => {
    const url = new URL(request.url)

    // Parse multi-select parameters (comma-separated or multiple params)
    const parsePriorities = () => {
      const val = url.searchParams.get('priority')
      return val ? val.split(',').filter(Boolean) : []
    }

    const parseStatuses = () => {
      const val = url.searchParams.get('status')
      return val ? val.split(',').filter(Boolean) : []
    }

    const parseAgents = () => {
      const val = url.searchParams.get('agents')
      return val ? val.split(',').filter(Boolean) : []
    }

    const parseSprints = () => {
      const val = url.searchParams.get('sprints')
      return val ? val.split(',').filter(Boolean) : []
    }

    const params: SearchParams = {
      q: url.searchParams.get('q') || undefined,
      priority: parsePriorities(),
      status: parseStatuses(),
      assignedAgent: parseAgents(),
      sprint: parseSprints(),
      deadlineFrom: url.searchParams.get('deadlineFrom') || undefined,
      deadlineTo: url.searchParams.get('deadlineTo') || undefined,
      page: url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!, 10) : 1,
      perPage: url.searchParams.get('perPage') ? parseInt(url.searchParams.get('perPage')!, 10) : 20,
    }

    const result = searchTasks(params)

    return HttpResponse.json<TaskSearchResponse>(result)
  }),

  // POST endpoint for global task search with structured filters
  http.post('/api/tasks/search', async ({ request }) => {
    // Simulate realistic latency (300-600ms)
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 300))

    try {
      const body = await request.json() as {
        filters: SearchFilters
        page?: number
        pageSize?: number
      }

      const result = searchWithFilters(body.filters, body.page, body.pageSize)

      return HttpResponse.json<SearchResponse>(result)
    } catch (error) {
      return HttpResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }
  }),

  // GET /api/search/saved-filters — retrieve all saved filter sets
  http.get('/api/search/saved-filters', () => {
    const filters = Array.from(savedFiltersStore.values())
    return HttpResponse.json({ filters })
  }),

  // POST /api/search/saved-filters — save a new filter set
  http.post('/api/search/saved-filters', async ({ request }) => {
    try {
      const body = await request.json() as SaveFilterRequest

      const id = generateId()
      const now = new Date().toISOString()

      const savedFilter: SavedFilter = {
        id,
        name: body.name,
        description: body.description,
        filters: body.filters,
        createdAt: now,
        updatedAt: now,
      }

      savedFiltersStore.set(id, savedFilter)

      return HttpResponse.json(savedFilter, { status: 201 })
    } catch (error) {
      return HttpResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }
  }),

  // PATCH /api/search/saved-filters/:id — update saved filter
  http.patch('/api/search/saved-filters/:id', async ({ request, params }) => {
    try {
      const { id } = params
      const existingFilter = savedFiltersStore.get(id as string)

      if (!existingFilter) {
        return HttpResponse.json(
          { error: 'Filter not found' },
          { status: 404 }
        )
      }

      const body = await request.json() as SaveFilterRequest

      const updated: SavedFilter = {
        ...existingFilter,
        name: body.name,
        description: body.description,
        filters: body.filters,
        updatedAt: new Date().toISOString(),
      }

      savedFiltersStore.set(id as string, updated)

      return HttpResponse.json(updated)
    } catch (error) {
      return HttpResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }
  }),

  // DELETE /api/search/saved-filters/:id — delete saved filter
  http.delete('/api/search/saved-filters/:id', ({ params }) => {
    const { id } = params
    const exists = savedFiltersStore.has(id as string)

    if (!exists) {
      return HttpResponse.json(
        { error: 'Filter not found' },
        { status: 404 }
      )
    }

    savedFiltersStore.delete(id as string)
    return HttpResponse.json({ success: true })
  }),

  // POST /api/search/saved-filters/reset — reset all saved filters
  http.post('/api/search/saved-filters/reset', () => {
    savedFiltersStore.clear()
    return HttpResponse.json({ success: true })
  }),
]
