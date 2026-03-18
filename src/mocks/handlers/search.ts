/**
 * MSW Handlers for Global Search
 *
 * Provides unified search across tasks, sprints, and agents with:
 * - Multi-entity search (tasks, sprints, agents)
 * - Full-text search across entity names/titles and descriptions
 * - Filtering by entity type and status
 * - Pagination support (page, pageSize)
 * - Matched field metadata for highlighting in UI
 * - Client-side filtering logic
 */

import { http, HttpResponse } from 'msw'
import type { Task, TaskStatus, TaskPriority } from '../../types/task'
import type { Sprint } from '../../types/sprint'
import type { AgentManagement } from '../../types/agent'
import type { GlobalSearchResult, GlobalSearchResponse, GlobalSearchEntityType } from '../../types/search'

/**
 * Mock task data (same as tasks handler)
 */
const mockTasksData: Task[] = [
  {
    id: 'task-1',
    title: 'Implement authentication',
    assignee: 'agent-1',
    team: 'backend',
    status: 'in-progress' as TaskStatus,
    priority: 'high' as TaskPriority,
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
    status: 'backlog' as TaskStatus,
    priority: 'high' as TaskPriority,
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
    title: 'Write API documentation',
    assignee: 'agent-1',
    team: 'platform',
    status: 'done' as TaskStatus,
    priority: 'medium' as TaskPriority,
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
    title: 'Fix critical login bug in authentication flow',
    assignee: 'agent-3',
    team: 'frontend',
    status: 'in-review' as TaskStatus,
    priority: 'high' as TaskPriority,
    storyPoints: 3,
    sprint: 'sprint-2',
    order: 4,
    estimatedHours: 4,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    version: 1,
  },
  {
    id: 'task-5',
    title: 'Optimize database queries',
    assignee: 'agent-2',
    team: 'backend',
    status: 'in-progress' as TaskStatus,
    priority: 'medium' as TaskPriority,
    storyPoints: 8,
    sprint: 'sprint-2',
    order: 5,
    estimatedHours: 12,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    version: 1,
  },
]

/**
 * Mock sprint data
 */
const mockSprintsData: Sprint[] = [
  {
    id: 'sprint-1',
    name: 'Sprint 1 - Auth & Core Features',
    status: 'archived',
    goals: 'Implement user authentication and basic CRUD operations',
    tasks: ['task-1', 'task-2', 'task-3', 'task-4', 'task-5'],
    estimatedPoints: 34,
    taskCount: 5,
    completedCount: 5,
    createdAt: '2026-02-01T10:00:00Z',
    startDate: '2026-02-01T00:00:00Z',
    endDate: '2026-02-14T23:59:59Z',
    version: 1,
  },
  {
    id: 'sprint-2',
    name: 'Sprint 2 - API & Data Layer Implementation',
    status: 'active',
    goals: 'Build REST API with proper validation and error handling',
    tasks: ['task-6', 'task-7', 'task-8', 'task-9', 'task-10', 'task-11'],
    estimatedPoints: 45,
    taskCount: 6,
    completedCount: 3,
    createdAt: '2026-02-15T10:00:00Z',
    startDate: '2026-02-15T00:00:00Z',
    endDate: '2026-02-28T23:59:59Z',
    version: 1,
  },
  {
    id: 'sprint-3',
    name: 'Sprint 3 - UI Polish & Performance',
    status: 'planning',
    goals: 'Refine user interface and optimize performance metrics',
    tasks: ['task-12', 'task-13', 'task-14'],
    estimatedPoints: 28,
    taskCount: 3,
    completedCount: 0,
    createdAt: '2026-02-20T10:00:00Z',
    version: 1,
  },
]

/**
 * Mock agent data
 */
const mockAgentsData: (AgentManagement & { id: string; name: string })[] = [
  {
    id: 'agent-1',
    name: 'Alice',
    capabilities: ['code-review', 'refactoring', 'architecture'],
    status: 'active' as const,
    taskCount: 3,
    successRate: 95.5,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'agent-2',
    name: 'Bob',
    capabilities: ['feature-implementation', 'testing', 'debugging'],
    status: 'idle' as const,
    taskCount: 5,
    successRate: 88.2,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'agent-3',
    name: 'Charlie',
    capabilities: ['api-design', 'database-optimization', 'infrastructure'],
    status: 'busy' as const,
    taskCount: 2,
    successRate: 92.0,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

/**
 * Determine which field matched the search query
 * Returns the first matching field with highlighted flag
 */
function findMatchedField(
  entity: GlobalSearchResult,
  query: string
): { field: string; value: string; highlighted: boolean } {
  const queryLower = query.toLowerCase()

  // Title/name always takes priority
  if (entity.title.toLowerCase().includes(queryLower)) {
    return {
      field: 'title',
      value: entity.title,
      highlighted: true,
    }
  }

  // Then description
  if (entity.description && entity.description.toLowerCase().includes(queryLower)) {
    return {
      field: 'description',
      value: entity.description,
      highlighted: true,
    }
  }

  // Default to title if no match found (shouldn't happen if filtered correctly)
  return {
    field: 'title',
    value: entity.title,
    highlighted: false,
  }
}

/**
 * Convert task to global search result
 */
function taskToSearchResult(task: Task): GlobalSearchResult {
  return {
    id: task.id,
    type: 'task' as GlobalSearchEntityType,
    title: task.title,
    description: undefined,
    matchedField: {
      field: 'title',
      value: task.title,
      highlighted: false,
    },
    metadata: {
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
      sprintId: task.sprint,
    },
    createdAt: task.createdAt,
  }
}

/**
 * Convert sprint to global search result
 */
function sprintToSearchResult(sprint: Sprint): GlobalSearchResult {
  return {
    id: sprint.id,
    type: 'sprint' as GlobalSearchEntityType,
    title: sprint.name,
    description: sprint.goals,
    matchedField: {
      field: 'name',
      value: sprint.name,
      highlighted: false,
    },
    metadata: {
      sprintStatus: sprint.status,
      taskCount: sprint.taskCount,
    },
    createdAt: sprint.createdAt,
  }
}

/**
 * Convert agent to global search result
 */
function agentToSearchResult(agent: (typeof mockAgentsData)[0]): GlobalSearchResult {
  return {
    id: agent.id,
    type: 'agent' as GlobalSearchEntityType,
    title: agent.name,
    description: agent.capabilities.join(', '),
    matchedField: {
      field: 'name',
      value: agent.name,
      highlighted: false,
    },
    metadata: {
      agentStatus: agent.status,
      agentRole: (agent.status as string) as 'sr-dev' | 'junior' | 'pm',
    },
    createdAt: agent.createdAt,
  }
}

/**
 * Filter results based on search query and filters
 */
function filterAndSearch(
  query: string = '',
  type?: GlobalSearchEntityType,
  status?: string,
  page: number = 1,
  pageSize: number = 20
): GlobalSearchResponse {
  const queryLower = query.toLowerCase()
  let results: GlobalSearchResult[] = []

  // Search tasks
  if (!type || type === 'task') {
    const filteredTasks = mockTasksData.filter((task) => {
      // Query match
      const queryMatch = !query || task.title.toLowerCase().includes(queryLower)

      // Status filter
      const statusMatch = !status || task.status === status

      return queryMatch && statusMatch
    })

    results.push(...filteredTasks.map(taskToSearchResult))
  }

  // Search sprints
  if (!type || type === 'sprint') {
    const filteredSprints = mockSprintsData.filter((sprint) => {
      // Query match - search in name and goals
      const queryMatch =
        !query ||
        sprint.name.toLowerCase().includes(queryLower) ||
        sprint.goals.toLowerCase().includes(queryLower)

      // Status filter
      const statusMatch = !status || sprint.status === status

      return queryMatch && statusMatch
    })

    results.push(...filteredSprints.map(sprintToSearchResult))
  }

  // Search agents
  if (!type || type === 'agent') {
    const filteredAgents = mockAgentsData.filter((agent) => {
      // Query match - search in name and capabilities
      const queryMatch =
        !query ||
        agent.name.toLowerCase().includes(queryLower) ||
        agent.capabilities.some((cap) => cap.toLowerCase().includes(queryLower))

      // Status filter
      const statusMatch = !status || agent.status === status

      return queryMatch && statusMatch
    })

    results.push(...filteredAgents.map(agentToSearchResult))
  }

  // Find matched fields with proper highlighting
  results = results.map((result) => ({
    ...result,
    matchedField: findMatchedField(result, query),
  }))

  // Sort by creation date (most recent first)
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Pagination
  const totalCount = results.length
  const totalPages = Math.ceil(totalCount / pageSize)
  const startIdx = Math.max(0, (page - 1) * pageSize)
  const endIdx = Math.min(startIdx + pageSize, totalCount)

  const paginatedResults = results.slice(startIdx, endIdx)

  return {
    results: paginatedResults,
    totalCount,
    page,
    pageSize,
    hasMore: endIdx < totalCount,
  }
}

/**
 * MSW handler for GET /api/search
 * Query params:
 * - q: Search query string
 * - type: Filter by entity type (task|sprint|agent)
 * - status: Filter by status (varies by type)
 * - page: Page number (default: 1)
 * - pageSize: Results per page (default: 20)
 */
export const searchHandlers = [
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q') || ''
    const type = (url.searchParams.get('type') || undefined) as GlobalSearchEntityType | undefined
    const status = url.searchParams.get('status') || undefined
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10)

    const result = filterAndSearch(query, type, status, page, Math.min(100, pageSize))

    return HttpResponse.json(result, { status: 200 })
  }),
]
