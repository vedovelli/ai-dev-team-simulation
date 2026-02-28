import { http, HttpResponse } from 'msw'
import type { Agent, AgentRole, AgentStatus } from '../types/agent'
import type { Task, UpdateTaskInput, TaskStatus, TaskPriority } from '../types/task'

interface Team {
  id: string
  name: string
  description: string
  memberCount: number
  createdAt: string
}

interface Task {
  title: string
  assignee: string
  storyPoints: number
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

// In-memory store for tasks with seed data
const tasksStore: Task[] = [
  {
    id: 'task-1',
    title: 'Implement authentication',
    assignee: 'John Doe',
    status: 'in-progress',
    priority: 'high',
    storyPoints: 8,
    sprint: 'sprint-1',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task-2',
    title: 'Create API documentation',
    assignee: 'Jane Smith',
    status: 'backlog',
    priority: 'medium',
    storyPoints: 5,
    sprint: 'sprint-1',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task-3',
    title: 'Fix login form validation',
    assignee: 'Bob Johnson',
    status: 'in-review',
    priority: 'high',
    storyPoints: 3,
    sprint: 'sprint-1',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task-4',
    title: 'Setup database migrations',
    assignee: 'Alice Williams',
    status: 'done',
    priority: 'medium',
    storyPoints: 5,
    sprint: 'sprint-1',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task-5',
    title: 'Design dashboard components',
    assignee: 'Charlie Brown',
    status: 'backlog',
    priority: 'low',
    storyPoints: 8,
    sprint: 'sprint-1',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task-6',
    title: 'Write unit tests for services',
    assignee: 'Diana Prince',
    status: 'in-progress',
    priority: 'high',
    storyPoints: 5,
    sprint: 'sprint-1',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

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

    let filteredTasks = tasksStore

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

    return HttpResponse.json(filteredTasks)
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
      status: (body.status as TaskStatus) || 'backlog',
      priority: (body.priority as TaskPriority) || 'medium',
      storyPoints: 0,
      sprint: body.sprint || 'sprint-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    tasksStore.push(newTask)
    return HttpResponse.json(newTask, { status: 201 })
  }),
]
