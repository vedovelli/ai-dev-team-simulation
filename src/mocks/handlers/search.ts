/**
 * MSW Handlers for Advanced Search
 *
 * Provides mock API endpoint for search functionality with:
 * - Multi-filter support (AND logic)
 * - Text search across task titles
 * - Status and agent filtering
 * - Pagination support
 * - Realistic search results
 */

import { http, HttpResponse } from 'msw'
import type { Task, TaskStatus } from '../../types/task'

// Import shared mock task data
const mockTasks: Task[] = []

/**
 * Generate mock search results based on filters
 * This function filters tasks based on provided search criteria
 */
function filterTasks(
  tasks: Task[],
  filters: {
    search?: string
    status?: string
    agent?: string
    page?: number
    limit?: number
  }
): { data: Task[]; total: number; page: number; limit: number; totalPages: number } {
  let filtered = [...tasks]

  // Text search filter (search across title)
  if (filters.search && filters.search.trim()) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter((task) =>
      task.title.toLowerCase().includes(searchLower) ||
      task.id.toLowerCase().includes(searchLower)
    )
  }

  // Status filter
  if (filters.status && filters.status !== '') {
    filtered = filtered.filter((task) => task.status === filters.status)
  }

  // Agent filter (filter by assignee)
  if (filters.agent && filters.agent !== '') {
    filtered = filtered.filter((task) => task.assignee === filters.agent)
  }

  // Pagination
  const page = Math.max(1, filters.page || 1)
  const limit = Math.min(100, Math.max(1, filters.limit || 50))
  const totalPages = Math.ceil(filtered.length / limit)
  const startIdx = (page - 1) * limit
  const endIdx = startIdx + limit

  const paginated = filtered.slice(startIdx, endIdx)

  return {
    data: paginated,
    total: filtered.length,
    page,
    limit,
    totalPages,
  }
}

/**
 * Generate initial mock tasks for testing
 */
function generateInitialTasks(): Task[] {
  const statuses: TaskStatus[] = ['backlog', 'in-progress', 'in-review', 'done']
  const teams = ['Frontend', 'Backend', 'DevOps', 'Design', 'QA']
  const assignees = [
    'John Doe',
    'Jane Smith',
    'Bob Johnson',
    'Alice Williams',
    'Charlie Brown',
    'Diana Prince',
  ]

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

  const tasks: Task[] = []
  for (let i = 1; i <= 100; i++) {
    tasks.push({
      id: `task-${i}`,
      title: `${taskTitles[i % taskTitles.length]} #${i}`,
      assignee: assignees[i % assignees.length],
      team: teams[i % teams.length],
      status: statuses[i % statuses.length],
      priority: (['low', 'medium', 'high'] as const)[i % 3],
      storyPoints: (i % 13) + 1,
      sprint: `sprint-${(i % 3) + 1}`,
      order: i % 10,
      estimatedHours: (i % 40) + 1,
      createdAt: new Date(
        Date.now() - (i * 24 * 60 * 60 * 1000) % (30 * 24 * 60 * 60 * 1000)
      ).toISOString(),
      updatedAt: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      dependsOn: [],
    })
  }

  return tasks
}

// Initialize tasks store
const tasksStore = generateInitialTasks()

/**
 * MSW handler for GET /api/search
 */
export const searchHandlers = [
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || undefined
    const status = url.searchParams.get('status') || undefined
    const agent = url.searchParams.get('agent') || undefined
    const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!, 10) : 1
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : 50

    const result = filterTasks(tasksStore, {
      search,
      status,
      agent,
      page,
      limit,
    })

    return HttpResponse.json(
      {
        data: result.data,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      },
      { status: 200 }
    )
  }),
]
