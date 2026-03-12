/**
 * Enhanced MSW Handlers with Router-Driven Table State Support
 *
 * Provides server-side filtering, searching, and sorting for:
 * - GET /api/tasks - Task listing with query params
 * - GET /api/agents - Agent listing with query params
 * - GET /api/sprints - Sprint listing with query params
 *
 * Supports query parameters:
 * - ?search=term - Full-text search across fields
 * - ?filter[status]=active - Field-specific filtering (bracket notation)
 * - ?filter[priority]=high
 * - ?sort=field or ?sort=-field (- prefix for descending)
 * - ?page=2&limit=20 - Pagination
 *
 * Returns normalized response format:
 * {
 *   data: T[],
 *   meta: {
 *     total: number,
 *     page: number,
 *     limit: number,
 *     hasMore: boolean
 *   }
 * }
 */

import { http, HttpResponse, delay } from 'msw'
import type { Task } from '../../types/task'
import type { AgentManagement } from '../../types/agent'
import type { Sprint } from '../../types/sprint'

/**
 * Query parameters parsed from URL
 */
interface ParsedQuery {
  search: string
  filters: Record<string, string>
  sort: { field: string; desc: boolean } | null
  page: number
  limit: number
}

/**
 * Parse query parameters from URL
 */
function parseQueryParams(url: URL): ParsedQuery {
  const search = url.searchParams.get('search') || ''

  // Parse filters with bracket notation: filter[status]=active
  const filters: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    const match = key.match(/^filter\[([^\]]+)\]$/)
    if (match) {
      filters[match[1]] = value
    }
  })

  // Parse sort: sort=field or sort=-field (descending)
  const sortParam = url.searchParams.get('sort')
  let sort: { field: string; desc: boolean } | null = null
  if (sortParam) {
    const desc = sortParam.startsWith('-')
    const field = desc ? sortParam.slice(1) : sortParam
    sort = { field, desc }
  }

  // Parse pagination
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10)))

  return { search, filters, sort, page, limit }
}

/**
 * Apply search filter to items
 * Searches across all string fields
 */
function applySearch<T extends Record<string, any>>(items: T[], search: string): T[] {
  if (!search) return items

  const lowerSearch = search.toLowerCase()
  return items.filter((item) =>
    Object.values(item).some(
      (value) =>
        typeof value === 'string' &&
        value.toLowerCase().includes(lowerSearch)
    )
  )
}

/**
 * Apply field filters to items
 */
function applyFilters<T extends Record<string, any>>(
  items: T[],
  filters: Record<string, string>
): T[] {
  return items.filter((item) =>
    Object.entries(filters).every(([field, value]) => {
      const itemValue = item[field as keyof T]
      if (itemValue == null) return false
      return String(itemValue).toLowerCase() === value.toLowerCase()
    })
  )
}

/**
 * Apply sorting to items
 */
function applySorting<T extends Record<string, any>>(
  items: T[],
  sort: { field: string; desc: boolean } | null
): T[] {
  if (!sort) return items

  const { field, desc } = sort
  return [...items].sort((a, b) => {
    const aVal = a[field as keyof T]
    const bVal = b[field as keyof T]

    if (aVal == null && bVal == null) return 0
    if (aVal == null) return desc ? -1 : 1
    if (bVal == null) return desc ? 1 : -1

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const comparison = aVal.localeCompare(bVal)
      return desc ? -comparison : comparison
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return desc ? bVal - aVal : aVal - bVal
    }

    if (aVal < bVal) return desc ? 1 : -1
    if (aVal > bVal) return desc ? -1 : 1
    return 0
  })
}

/**
 * Apply pagination to items
 */
function applyPagination<T>(
  items: T[],
  page: number,
  limit: number
): { items: T[]; total: number; page: number; hasMore: boolean } {
  const total = items.length
  const start = (page - 1) * limit
  const end = start + limit
  const paginatedItems = items.slice(start, end)

  return {
    items: paginatedItems,
    total,
    page,
    hasMore: end < total,
  }
}

/**
 * Mock task data (reuse existing data)
 */
const mockTasks: Task[] = [
  {
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
  {
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
  {
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
  {
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
  {
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
]

/**
 * Mock agents data
 */
const mockAgents: AgentManagement[] = [
  {
    id: 'agent-1',
    name: 'Alice',
    capabilities: ['code-review', 'refactoring'],
    status: 'active',
    taskCount: 5,
    successRate: 95.5,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'agent-2',
    name: 'Bob',
    capabilities: ['feature-implementation', 'testing'],
    status: 'idle',
    taskCount: 2,
    successRate: 88.0,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'agent-3',
    name: 'Charlie',
    capabilities: ['bug-fixes', 'documentation'],
    status: 'busy',
    taskCount: 8,
    successRate: 92.0,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

/**
 * Mock sprints data
 */
const mockSprints: Sprint[] = [
  {
    id: 'sprint-1',
    name: 'Sprint 1',
    status: 'active',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    team: 'backend',
    goal: 'Implement core API',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sprint-2',
    name: 'Sprint 2',
    status: 'planning',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    team: 'frontend',
    goal: 'Improve UI/UX',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

/**
 * Enhanced task listing with server-side filtering
 */
const taskListHandler = http.get('/api/tasks', async ({ request }) => {
  await delay(200)

  const query = parseQueryParams(new URL(request.url))

  // Apply filters in sequence
  let filtered = mockTasks
  filtered = applySearch(filtered, query.search)
  filtered = applyFilters(filtered, query.filters)
  filtered = applySorting(filtered, query.sort)

  // Apply pagination
  const { items, total, page, hasMore } = applyPagination(
    filtered,
    query.page,
    query.limit
  )

  return HttpResponse.json({
    data: items,
    meta: {
      total,
      page,
      limit: query.limit,
      hasMore,
    },
  })
})

/**
 * Enhanced agent listing with server-side filtering
 */
const agentListHandler = http.get('/api/agents', async ({ request }) => {
  await delay(200)

  const query = parseQueryParams(new URL(request.url))

  // Apply filters in sequence
  let filtered = mockAgents
  filtered = applySearch(filtered, query.search)
  filtered = applyFilters(filtered, query.filters)
  filtered = applySorting(filtered, query.sort)

  // Apply pagination
  const { items, total, page, hasMore } = applyPagination(
    filtered,
    query.page,
    query.limit
  )

  return HttpResponse.json({
    data: items,
    meta: {
      total,
      page,
      limit: query.limit,
      hasMore,
    },
  })
})

/**
 * Enhanced sprint listing with server-side filtering
 */
const sprintListHandler = http.get('/api/sprints', async ({ request }) => {
  await delay(200)

  const query = parseQueryParams(new URL(request.url))

  // Apply filters in sequence
  let filtered = mockSprints
  filtered = applySearch(filtered, query.search)
  filtered = applyFilters(filtered, query.filters)
  filtered = applySorting(filtered, query.sort)

  // Apply pagination
  const { items, total, page, hasMore } = applyPagination(
    filtered,
    query.page,
    query.limit
  )

  return HttpResponse.json({
    data: items,
    meta: {
      total,
      page,
      limit: query.limit,
      hasMore,
    },
  })
})

export const tableRouterHandlers = [
  taskListHandler,
  agentListHandler,
  sprintListHandler,
]
