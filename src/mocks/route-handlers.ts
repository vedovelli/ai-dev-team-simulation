import { http, HttpResponse } from 'msw'
import type { Agent } from '../types/agent'
import type { Task } from '../types/task'
import type { Team } from '../types/team'

// Remove duplicate Team interface since it's imported from types
type RouteTeam = Team

/**
 * Route-based MSW handlers for testing route requirements
 * These handlers validate and respond based on route parameters
 */

/**
 * Agents route handlers
 */
export const agentRouteHandlers = [
  // GET /api/agents - List all agents with optional search parameters
  http.get('/api/agents', ({ request }) => {
    const url = new URL(request.url)
    const filter = url.searchParams.get('filter')?.toLowerCase() ?? ''
    const sort = url.searchParams.get('sort') ?? 'name'
    const sortOrder = url.searchParams.get('sortOrder') ?? 'asc'

    let agents: Agent[] = [
      {
        id: 'agent-1',
        name: 'Alice',
        role: 'Frontend Developer',
        status: 'working',
        workload: 85,
        currentTasks: 3,
      },
      {
        id: 'agent-2',
        name: 'Bob',
        role: 'Backend Developer',
        status: 'idle',
        workload: 30,
        currentTasks: 1,
      },
      {
        id: 'agent-3',
        name: 'Charlie',
        role: 'DevOps Engineer',
        status: 'blocked',
        workload: 50,
        currentTasks: 2,
      },
    ]

    // Apply filter
    if (filter) {
      agents = agents.filter(
        (agent) =>
          agent.name.toLowerCase().includes(filter) ||
          agent.role.toLowerCase().includes(filter)
      )
    }

    // Apply sorting
    agents.sort((a, b) => {
      let comparison = 0
      if (sort === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sort === 'status') {
        comparison = a.status.localeCompare(b.status)
      } else if (sort === 'role') {
        comparison = a.role.localeCompare(b.role)
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })

    return HttpResponse.json({ data: agents })
  }),

  // GET /api/agents/:id - Get agent detail
  http.get('/api/agents/:id', ({ params }) => {
    const { id } = params
    const agent: Agent = {
      id: String(id),
      name: 'Alice',
      role: 'Frontend Developer',
      status: 'working',
      workload: 85,
      currentTasks: 3,
    }

    return HttpResponse.json({ data: agent })
  }),
]

/**
 * Sprints route handlers
 */
export const sprintRouteHandlers = [
  // GET /api/sprints/:id/health - Get sprint health metrics
  http.get('/api/sprints/:id/health', ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      data: {
        id,
        name: 'Sprint 1',
        health: 85,
        tasksCompleted: 8,
        tasksTotal: 10,
        velocity: 34,
        burndownData: [
          { day: 'Mon', remaining: 50 },
          { day: 'Tue', remaining: 45 },
          { day: 'Wed', remaining: 38 },
          { day: 'Thu', remaining: 30 },
          { day: 'Fri', remaining: 15 },
        ],
      },
    })
  }),
]

/**
 * Tasks route handlers with search parameter support
 */
export const taskRouteHandlers = [
  // GET /api/tasks - List tasks with filtering and sorting
  http.get('/api/tasks', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const priority = url.searchParams.get('priority')
    const search = url.searchParams.get('search')
    const team = url.searchParams.get('team')
    const assignee = url.searchParams.get('assignee')
    const sortBy = url.searchParams.get('sortBy')
    const sortOrder = url.searchParams.get('sortOrder')

    let tasks: Task[] = [
      {
        id: '1',
        title: 'Implement authentication',
        status: 'in-progress',
        priority: 'high',
        team: 'Backend',
        assignee: 'Bob',
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      },
      {
        id: '2',
        title: 'Design dashboard UI',
        status: 'todo',
        priority: 'medium',
        team: 'Frontend',
        assignee: 'Alice',
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 172800000).toISOString(),
      },
      {
        id: '3',
        title: 'Deploy to staging',
        status: 'done',
        priority: 'high',
        team: 'DevOps',
        assignee: 'Charlie',
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() - 86400000).toISOString(),
      },
    ]

    // Apply filters
    if (status) tasks = tasks.filter((t) => t.status === status)
    if (priority) tasks = tasks.filter((t) => t.priority === priority)
    if (search) {
      tasks = tasks.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (team) tasks = tasks.filter((t) => t.team === team)
    if (assignee) tasks = tasks.filter((t) => t.assignee === assignee)

    // Apply sorting
    if (sortBy) {
      tasks.sort((a, b) => {
        const aVal = a[sortBy as keyof Task]
        const bVal = b[sortBy as keyof Task]

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'desc'
            ? bVal.localeCompare(aVal)
            : aVal.localeCompare(bVal)
        }

        return 0
      })
    }

    return HttpResponse.json({ data: tasks })
  }),
]

/**
 * Teams route handlers
 */
export const teamRouteHandlers = [
  // GET /api/teams - List teams
  http.get('/api/teams', () => {
    const teams: Team[] = [
      {
        id: 'team-1',
        name: 'Frontend Team',
        description: 'Responsible for UI/UX',
        memberCount: 3,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'team-2',
        name: 'Backend Team',
        description: 'API and database management',
        memberCount: 2,
        createdAt: new Date().toISOString(),
      },
    ]

    return HttpResponse.json({ data: teams })
  }),

  // GET /api/teams/:id - Get team details
  http.get('/api/teams/:id', ({ params }) => {
    const { id } = params
    const team: Team = {
      id: String(id),
      name: 'Frontend Team',
      description: 'Responsible for UI/UX',
      memberCount: 3,
      createdAt: new Date().toISOString(),
    }

    return HttpResponse.json({ data: team })
  }),
]

/**
 * Combine all route-based handlers
 */
export const routeHandlers = [
  ...agentRouteHandlers,
  ...sprintRouteHandlers,
  ...taskRouteHandlers,
  ...teamRouteHandlers,
]
