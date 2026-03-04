import { http, HttpResponse } from 'msw'

/**
 * Route-based MSW handlers for testing route requirements
 * These handlers validate and respond based on route parameters
 */

/**
 * Agents route handlers with search parameter support
 */
export const agentRouteHandlers = [
  // GET /api/agents - List all agents with optional search parameters
  http.get('/api/agents', ({ request }) => {
    const url = new URL(request.url)
    const filter = url.searchParams.get('filter')?.toLowerCase() ?? ''
    const sort = url.searchParams.get('sort') ?? 'name'
    const sortOrder = url.searchParams.get('sortOrder') ?? 'asc'

    // Mock agent data
    const agents = [
      {
        id: 'agent-1',
        name: 'Alice',
        role: 'sr-dev' as const,
        status: 'working' as const,
        currentTask: 'Implementing feature X',
        output: 'Successfully merged PR',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'agent-2',
        name: 'Bob',
        role: 'junior' as const,
        status: 'idle' as const,
        currentTask: 'Code review',
        output: 'Waiting for feedback',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'agent-3',
        name: 'Charlie',
        role: 'pm' as const,
        status: 'blocked' as const,
        currentTask: 'Planning sprint',
        output: 'Blocked on dependency',
        lastUpdated: new Date().toISOString(),
      },
    ]

    // Apply filter
    let filtered = agents
    if (filter) {
      filtered = agents.filter(
        (agent) =>
          agent.name.toLowerCase().includes(filter) ||
          agent.role.toLowerCase().includes(filter)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
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

    return HttpResponse.json({ data: filtered })
  }),

  // GET /api/agents/:id - Get agent detail by ID
  http.get('/api/agents/:id', ({ params }) => {
    const { id } = params
    const agent = {
      id: String(id),
      name: 'Alice',
      role: 'sr-dev' as const,
      status: 'working' as const,
      currentTask: 'Implementing feature X',
      output: 'Successfully merged PR',
      lastUpdated: new Date().toISOString(),
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

    // Mock task data
    const tasks = [
      {
        id: '1',
        title: 'Implement authentication',
        status: 'in-progress' as const,
        priority: 'high' as const,
        team: 'Backend',
        assignee: 'Bob',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Design dashboard UI',
        status: 'backlog' as const,
        priority: 'medium' as const,
        team: 'Frontend',
        assignee: 'Alice',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'Deploy to staging',
        status: 'done' as const,
        priority: 'high' as const,
        team: 'DevOps',
        assignee: 'Charlie',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    // Apply filters
    let filtered = tasks
    if (status) filtered = filtered.filter((t) => t.status === status)
    if (priority) filtered = filtered.filter((t) => t.priority === priority)
    if (search) {
      filtered = filtered.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (team) filtered = filtered.filter((t) => t.team === team)
    if (assignee) filtered = filtered.filter((t) => t.assignee === assignee)

    // Apply sorting
    if (sortBy && sortOrder) {
      filtered.sort((a, b) => {
        const aVal = a[sortBy as keyof typeof tasks[0]]
        const bVal = b[sortBy as keyof typeof tasks[0]]

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'desc'
            ? bVal.localeCompare(aVal)
            : aVal.localeCompare(bVal)
        }

        return 0
      })
    }

    return HttpResponse.json({ data: filtered })
  }),
]

/**
 * Teams route handlers
 */
export const teamRouteHandlers = [
  // GET /api/teams - List teams
  http.get('/api/teams', () => {
    const teams = [
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
    const team = {
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
