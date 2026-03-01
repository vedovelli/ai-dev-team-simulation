import { http, HttpResponse } from 'msw'
import type { Agent, AgentRole, AgentStatus } from '../types/agent'
import type { Task, UpdateTaskInput } from '../types/task'

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

type TaskStatus = 'backlog' | 'in-progress' | 'in-review' | 'done'
type TaskPriority = 'low' | 'medium' | 'high'

// In-memory store for tasks with 1000+ seed data
const tasksStore: Task[] = generateMockTasks()

// In-memory store for sprints
const sprintsStore: Sprint[] = []

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

  http.get('/api/tasks', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const priority = url.searchParams.get('priority')
    const search = url.searchParams.get('search')
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
]
