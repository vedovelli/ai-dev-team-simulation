/**
 * MSW Handler for Task Search & Advanced Filtering
 *
 * Implements GET /api/tasks/search endpoint with:
 * - Full-text search across task titles and descriptions
 * - Faceted filtering (priority, status, assignedAgent, sprint)
 * - Facet aggregation response with counts
 * - Match highlights via matchedFields
 * - Pagination with metadata
 */

import { http, HttpResponse } from 'msw'
import type { TaskStatus, TaskPriority } from '../../types/task'
import type { TaskSearchResponse, SearchTask } from '../../types/task-search'

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

export const taskSearchHandlers = [
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
]
