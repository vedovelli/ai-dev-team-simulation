/**
 * MSW Handler for Task Search & Advanced Filtering
 *
 * Implements GET /api/tasks/search endpoint with:
 * - Multi-field filtering (status, assignee, priority, sprint, date range)
 * - Text search across task titles and IDs
 * - Sorting on any column
 * - Pagination with metadata
 */

import { http, HttpResponse } from 'msw'
import type { Task, TaskStatus, TaskPriority } from '../../types/task'

// Re-use mock tasks from the existing search handler
function generateMockTasks(): Task[] {
  const statuses: TaskStatus[] = ['backlog', 'in-progress', 'in-review', 'done']
  const priorities: TaskPriority[] = ['low', 'medium', 'high']
  const teams = ['Frontend', 'Backend', 'DevOps', 'Design', 'QA']
  const assignees = [
    'John Doe',
    'Jane Smith',
    'Bob Johnson',
    'Alice Williams',
    'Charlie Brown',
    'Diana Prince',
  ]
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

  const tasks: Task[] = []
  for (let i = 1; i <= 150; i++) {
    const createdDate = new Date(Date.now() - (i * 24 * 60 * 60 * 1000) % (60 * 24 * 60 * 60 * 1000))
    const deadline = new Date(createdDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000)

    tasks.push({
      id: `task-${i}`,
      title: `${taskTitles[i % taskTitles.length]} #${i}`,
      assignee: assignees[i % assignees.length],
      team: teams[i % teams.length],
      status: statuses[i % statuses.length],
      priority: priorities[i % priorities.length],
      storyPoints: (i % 13) + 1,
      sprint: sprints[i % sprints.length],
      order: i % 10,
      estimatedHours: (i % 40) + 1,
      createdAt: createdDate.toISOString(),
      updatedAt: new Date(
        createdDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      deadline: deadline.toISOString(),
      dependsOn: [],
      version: 1,
    })
  }

  return tasks
}

const mockTasks = generateMockTasks()

interface FilterParams {
  q?: string
  status?: string[]
  assigneeId?: string
  priority?: string
  sprintId?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  page?: number
  limit?: number
}

function filterAndSortTasks(params: FilterParams) {
  let filtered = [...mockTasks]

  // Text search
  if (params.q && params.q.trim()) {
    const searchLower = params.q.toLowerCase()
    filtered = filtered.filter(
      (task) =>
        task.title.toLowerCase().includes(searchLower) ||
        task.id.toLowerCase().includes(searchLower)
    )
  }

  // Status filter (multi-select)
  if (params.status && params.status.length > 0) {
    filtered = filtered.filter((task) => params.status!.includes(task.status))
  }

  // Assignee filter
  if (params.assigneeId) {
    filtered = filtered.filter((task) => task.assignee === params.assigneeId)
  }

  // Priority filter
  if (params.priority) {
    filtered = filtered.filter((task) => task.priority === params.priority)
  }

  // Sprint filter
  if (params.sprintId) {
    filtered = filtered.filter((task) => task.sprint === params.sprintId)
  }

  // Date range filter
  if (params.dateFrom) {
    const fromDate = new Date(params.dateFrom)
    filtered = filtered.filter((task) => new Date(task.createdAt) >= fromDate)
  }

  if (params.dateTo) {
    const toDate = new Date(params.dateTo)
    filtered = filtered.filter((task) => new Date(task.createdAt) <= toDate)
  }

  // Sorting
  const sortBy = (params.sortBy || 'createdAt') as keyof Task
  const sortDir = params.sortDir || 'desc'

  filtered.sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]

    if (aVal === bVal) return 0

    const comparison = aVal < bVal ? -1 : 1
    return sortDir === 'asc' ? comparison : -comparison
  })

  // Pagination
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(100, Math.max(1, params.limit || 20))
  const pageCount = Math.ceil(filtered.length / limit)
  const startIdx = (page - 1) * limit
  const endIdx = startIdx + limit

  return {
    data: filtered.slice(startIdx, endIdx),
    total: filtered.length,
    page,
    pageSize: limit,
    pageCount,
  }
}

export const taskSearchHandlers = [
  http.get('/api/tasks/search', ({ request }) => {
    const url = new URL(request.url)

    // Parse multi-select status
    const statusRaw = url.searchParams.getAll('status')
    const status = statusRaw.length > 0 ? statusRaw : undefined

    const params: FilterParams = {
      q: url.searchParams.get('q') || undefined,
      status: status as any,
      assigneeId: url.searchParams.get('assigneeId') || undefined,
      priority: url.searchParams.get('priority') || undefined,
      sprintId: url.searchParams.get('sprintId') || undefined,
      dateFrom: url.searchParams.get('dateFrom') || undefined,
      dateTo: url.searchParams.get('dateTo') || undefined,
      sortBy: url.searchParams.get('sortBy') || undefined,
      sortDir: (url.searchParams.get('sortDir') as 'asc' | 'desc') || 'desc',
      page: url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!, 10) : 1,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : 20,
    }

    const result = filterAndSortTasks(params)

    return HttpResponse.json({
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        pageCount: result.pageCount,
      },
    })
  }),
]
