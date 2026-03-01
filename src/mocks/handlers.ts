import { http, HttpResponse } from 'msw'
import type { Agent, AgentRole, AgentStatus } from '../types/agent'
import type { Task, UpdateTaskInput, TaskStatus, TaskPriority } from '../types/task'
import type { Activity, ActivityEventType } from '../types/activity'

interface Team {
  id: string
  name: string
  description: string
  memberCount: number
  createdAt: string
}

interface Sprint {
  id: string
  name: string
  goals: string
  tasks: Task[]
  estimatedPoints: number
  createdAt: string
}

// In-memory store for teams
const teamsStore: Team[] = []

// In-memory store for agents
const agentsStore: Agent[] = generateMockAgents()

function generateMockAgents(): Agent[] {
  const roles: AgentRole[] = ['sr-dev', 'junior', 'pm']
  const statuses: AgentStatus[] = ['idle', 'working', 'blocked', 'completed']
  const tasks = [
    'Implementing feature X',
    'Debugging API response',
    'Code review',
    'Writing tests',
    'Refactoring component',
    'Updating documentation',
  ]
  const outputs = [
    'Successfully merged PR',
    'Found potential memory leak',
    'Tests passing',
    'Waiting for feedback',
    'Blocked on dependency',
    'Task completed',
  ]

  const agents: Agent[] = []
  for (let i = 0; i < 50; i++) {
    agents.push({
      id: `agent-${i + 1}`,
      name: `Agent ${i + 1}`,
      role: roles[i % roles.length],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      currentTask: tasks[Math.floor(Math.random() * tasks.length)],
      output: outputs[Math.floor(Math.random() * outputs.length)],
      lastUpdated: new Date(Date.now() - Math.random() * 300000).toISOString(),
    })
  }
  return agents
}

// Generate 1000+ mock tasks for testing virtual scrolling
function generateMockTasks(): Task[] {
  const statuses: TaskStatus[] = ['backlog', 'in-progress', 'in-review', 'done']
  const priorities: TaskPriority[] = ['low', 'medium', 'high']
  const teams = ['Frontend', 'Backend', 'DevOps', 'Design', 'QA']
  const sprints = ['sprint-1', 'sprint-2', 'sprint-3']
  const assignees = [
    'John Doe',
    'Jane Smith',
    'Bob Johnson',
    'Alice Williams',
    'Charlie Brown',
    'Diana Prince',
    'Eve Davis',
    'Frank Miller',
  ]

  const taskTitles = [
    'Implement authentication',
    'Create API documentation',
    'Fix login form validation',
    'Setup database migrations',
    'Design dashboard components',
    'Write unit tests for services',
    'Optimize database queries',
    'Implement caching layer',
    'Setup CI/CD pipeline',
    'Create user onboarding flow',
    'Fix reported bugs',
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
  for (let i = 1; i <= 1200; i++) {
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
      createdAt: new Date(
        Date.now() - (i * 24 * 60 * 60 * 1000) % (30 * 24 * 60 * 60 * 1000)
      ).toISOString(),
      updatedAt: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
  }
  return tasks
}


// In-memory store for tasks with 1000+ seed data
const tasksStore: Task[] = generateMockTasks()

interface CreateTaskPayload {
  name: string
  status: string
  team: string
  sprint: string
  priority: string
}

function getTaskIdCounter(): number {
  const maxId = tasksStore.reduce((max, task) => {
    const num = parseInt(task.id.replace('task-', ''), 10)
    return num > max ? num : max
  }, 0)
  return maxId + 1
}

// In-memory store for sprints
const sprintsStore: Sprint[] = []

// Generate mock activities for activity feed
function generateMockActivities(): Activity[] {
  const eventTypes: ActivityEventType[] = [
    'agent-state-change',
    'task-status-change',
    'message',
    'decision',
  ]

  const stateChanges = ['idle', 'working', 'blocked', 'completed']
  const taskStatuses = ['backlog', 'in-progress', 'in-review', 'done']
  const messages = [
    'Started working on new feature',
    'Found a bug in the authentication flow',
    'Completed code review',
    'Created PR for review',
    'Merged to main branch',
    'Deployed to staging',
    'Fixed type errors',
    'Added unit tests',
    'Resolved merge conflict',
    'Updated documentation',
  ]
  const decisions = [
    'Decided to use React Query for state management',
    'Chose TypeScript for better type safety',
    'Agreed on feature scope with team',
    'Prioritized performance optimization',
    'Approved architecture design',
  ]

  const activities: Activity[] = []
  const baseTime = Date.now()

  for (let i = 0; i < 100; i++) {
    const eventType = eventTypes[i % eventTypes.length]
    const agentId = `agent-${(i % 50) + 1}`
    const agentNumber = ((i % 50) + 1).toString()

    let message = ''
    let details = {}

    switch (eventType) {
      case 'agent-state-change':
        message = `Agent ${agentNumber} changed state to ${stateChanges[i % stateChanges.length]}`
        details = { newState: stateChanges[i % stateChanges.length] }
        break
      case 'task-status-change':
        message = `Task updated: Status changed to ${taskStatuses[i % taskStatuses.length]}`
        details = { taskId: `task-${i}`, newStatus: taskStatuses[i % taskStatuses.length] }
        break
      case 'message':
        message = messages[i % messages.length]
        break
      case 'decision':
        message = decisions[i % decisions.length]
        break
    }

    activities.push({
      id: `activity-${i + 1}`,
      type: eventType,
      agentId,
      agentName: `Agent ${agentNumber}`,
      message,
      timestamp: new Date(baseTime - i * 60000).toISOString(),
      details,
    })
  }

  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// In-memory store for activities
const activitiesStore: Activity[] = generateMockActivities()

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),

  http.post('/api/teams', async ({ request }) => {
    const body = await request.json() as Omit<Team, 'id' | 'createdAt'>

    const newTeam: Team = {
      id: `team-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    }

    teamsStore.push(newTeam)
    return HttpResponse.json(newTeam, { status: 201 })
  }),

  http.get('/api/teams', () => {
    return HttpResponse.json(teamsStore)
  }),

  http.get('/api/agents', () => {
    return HttpResponse.json(agentsStore)
  }),

  http.get('/api/agents/:agentId/history', ({ params }) => {
    const { agentId } = params
    // Generate mock history data for the agent
    const historyCount = 15
    const taskSamples = [
      'Implement feature X',
      'Debugging API response',
      'Code review',
      'Writing tests',
      'Refactoring component',
      'Updating documentation',
      'Fixing bug #123',
      'Reviewing PR #456',
      'Setting up CI/CD',
      'Optimizing performance',
    ]
    const statuses: Array<'completed' | 'failed' | 'cancelled'> = ['completed', 'failed', 'cancelled']

    const history = Array.from({ length: historyCount }, (_, i) => ({
      id: `${agentId}-history-${i}`,
      timestamp: new Date(
        Date.now() - (i * 2 * 60 * 60 * 1000)
      ).toISOString(),
      task: taskSamples[i % taskSamples.length],
      status: statuses[i % statuses.length],
      duration: Math.floor(Math.random() * 3600000) + 60000, // 1 min to 1 hour
    }))

    return HttpResponse.json(history)
  }),

  http.get('/api/tasks', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const priority = url.searchParams.get('priority')
    const search = url.searchParams.get('search')
    const team = url.searchParams.get('team')
    const sprint = url.searchParams.get('sprint')
    const assignee = url.searchParams.get('assignee')
    const pageIndex = parseInt(url.searchParams.get('pageIndex') || '0', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50', 10)
    const sortBy = url.searchParams.get('sortBy') || 'title'
    const sortOrder = url.searchParams.get('sortOrder') || 'asc'

    let filteredTasks = [...tasksStore]

    if (status) {
      filteredTasks = filteredTasks.filter((task) => task.status === status)
    }

    if (priority) {
      filteredTasks = filteredTasks.filter((task) => task.priority === priority)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredTasks = filteredTasks.filter((task) =>
        task.title.toLowerCase().includes(searchLower)
      )
    }

    if (team) {
      filteredTasks = filteredTasks.filter((task) => task.team === team)
    }

    if (sprint) {
      filteredTasks = filteredTasks.filter((task) => task.sprint === sprint)
    }

    if (assignee) {
      filteredTasks = filteredTasks.filter((task) => task.assignee === assignee)
    }

    // Sorting - validate sortBy is a valid Task field
    const validSortFields = Object.keys({} as Task)
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'title'

    filteredTasks.sort((a, b) => {
      const aValue = a[validSortBy as keyof Task] ?? ''
      const bValue = b[validSortBy as keyof Task] ?? ''

      let comparison = 0
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })

    // Pagination
    const start = pageIndex * pageSize
    const end = start + pageSize
    const paginatedTasks = filteredTasks.slice(start, end)

    return HttpResponse.json({
      data: paginatedTasks,
      total: filteredTasks.length,
      pageIndex,
      pageSize,
    })
  }),

  http.patch('/api/tasks/:id', async ({ request, params }) => {
    const { id } = params
    const body = (await request.json()) as UpdateTaskInput

    const taskIndex = tasksStore.findIndex((task) => task.id === id)
    if (taskIndex === -1) {
      return HttpResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const updatedTask: Task = {
      ...tasksStore[taskIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    }

    tasksStore[taskIndex] = updatedTask
    return HttpResponse.json(updatedTask)
  }),

  http.post('/api/sprints', async ({ request }) => {
    const body = await request.json() as Omit<Sprint, 'id' | 'createdAt'>

    const newSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    }

    sprintsStore.push(newSprint)
    return HttpResponse.json(newSprint, { status: 201 })
  }),

  http.get('/api/sprints', () => {
    return HttpResponse.json(sprintsStore)
  }),

  http.post('/api/tasks/validate-name', async ({ request }) => {
    const body = (await request.json()) as { name: string }

    // Check if any existing task has the same title (case-insensitive)
    const isDuplicate = tasksStore.some(
      (task) => task.title.toLowerCase() === body.name.toLowerCase()
    )

    return HttpResponse.json({
      isUnique: !isDuplicate,
      message: isDuplicate
        ? `Task with name "${body.name}" already exists`
        : undefined,
    })
  }),

  http.post('/api/tasks', async ({ request }) => {
    const body = (await request.json()) as CreateTaskPayload

    // Validate task name uniqueness
    const isDuplicate = tasksStore.some(
      (task) => task.title.toLowerCase() === body.name.toLowerCase()
    )

    if (isDuplicate) {
      return HttpResponse.json(
        { error: `Task with name "${body.name}" already exists` },
        { status: 400 }
      )
    }

    const newTask: Task = {
      id: `task-${getTaskIdCounter()}`,
      title: body.name,
      assignee: 'Unassigned',
      team: body.team || 'general',
      status: (body.status as TaskStatus) || 'backlog',
      priority: (body.priority as TaskPriority) || 'medium',
      storyPoints: 0,
      sprint: body.sprint || 'sprint-1',
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    tasksStore.push(newTask)
    return HttpResponse.json(newTask, { status: 201 })
  }),

  http.get('/api/activities', ({ request }) => {
    const url = new URL(request.url)
    const pageIndex = parseInt(url.searchParams.get('pageIndex') || '0', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10)

    // Pagination
    const start = pageIndex * pageSize
    const end = start + pageSize
    const paginatedActivities = activitiesStore.slice(start, end)

    return HttpResponse.json({
      data: paginatedActivities,
      total: activitiesStore.length,
      pageIndex,
      pageSize,
    })
  }),
]
