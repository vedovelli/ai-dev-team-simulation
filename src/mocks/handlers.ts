import { http, HttpResponse } from 'msw'
import type { Agent, AgentRole, AgentStatus } from '../types/agent'
import type { Task, UpdateTaskInput, TaskStatus, TaskPriority } from '../types/task'
import type { Activity, ActivityEventType } from '../types/activity'
import type { HistoryEntry, AgentDetailResponse } from '../types/agentHistory'
import type { User, UserRole } from '../types/user'
import type { Project } from '../types/project'
import type { Employee } from '../types/employee'
import type { SprintTask } from '../types/sprint'
import { optimisticUpdateHandlers } from './optimisticUpdateHandlers'
import { formSubmissionHandlers } from './formSubmissionHandlers'
import { metricsHandlers } from './handlers/metrics'
import { bulkOperationHandlers } from './handlers/bulk-operations'
import { agentCapacityHandlers } from './handlers/agentCapacity'
import { taskQueueHandlers } from './handlers/taskQueue'
import { taskHandlers } from './handlers/tasks'
import { sprintHandlers } from './handlers/sprints'
import { agentTaskQueueHandlers } from './handlers/agentTaskQueue'
import { sprintAnalyticsHandlers } from './handlers/sprintAnalytics'
import { agentStatusHandlers } from './handlers/agentStatus'
import { permissionHandlers } from './handlers/permissions'
import { agentManagementHandlers } from './handlers/agents'
import { notificationHandlers } from './handlers/notifications'
import { taskExecutionHandlers } from './handlers/taskExecution'
import { agentPresenceHandlers } from './handlers/agentPresence'
import { agentAvailabilityHandlers } from './handlers/agentAvailability'
import { workloadHandlers } from './handlers/workload'
import { activityHandlers } from './handlers/activity'
import { agentAnalyticsHandlers } from './handlers/agentAnalytics'
import { templateHandlers } from './handlers/templates'
import { analyticsHandlers } from './handlers/analytics'
import { searchHandlers } from './handlers/search'
import { dependencyHandlers } from './handlers/dependencies'

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

interface CreateTaskPayload {
  name: string
  status: string
  team: string
  sprint: string
  priority: string
  estimatedHours?: number
  assignedAgent?: string | null
}

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

// Generate mock employee data with 50+ records
function generateMockEmployees(): Employee[] {
  const firstNames = [
    'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Lisa',
    'Robert', 'Mary', 'Richard', 'Patricia', 'Joseph', 'Jennifer', 'Thomas',
    'Linda', 'Charles', 'Barbara', 'Christopher', 'Elizabeth', 'Daniel',
    'Susan', 'Matthew', 'Jessica', 'Mark', 'Karen', 'Donald', 'Nancy',
    'Steven', 'Lisa', 'Paul', 'Betty', 'Andrew', 'Margaret', 'Joshua',
    'Sandra', 'Kenneth', 'Ashley', 'Kevin', 'Kimberly', 'Brian', 'Emily',
    'George', 'Donna', 'Edward', 'Michelle', 'Ronald', 'Dorothy', 'Anthony',
  ]

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
    'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
    'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
    'Ramirez', 'Lewis', 'Robinson', 'Young', 'Allen', 'King', 'Wright',
    'Scott', 'Torres', 'Peterson', 'Phillips', 'Campbell', 'Parker',
  ]

  const departments = [
    'Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations',
    'Product', 'Design', 'Support', 'Legal',
  ]

  const positions = [
    'Manager', 'Senior Developer', 'Junior Developer', 'Product Manager',
    'Designer', 'Analyst', 'Coordinator', 'Specialist', 'Lead', 'Director',
    'Consultant', 'Engineer', 'Associate',
  ]

  const statuses: Array<'active' | 'inactive' | 'on-leave'> = [
    'active', 'active', 'active', 'inactive', 'on-leave',
  ]

  const employees: Employee[] = []
  for (let i = 0; i < 60; i++) {
    const firstName = firstNames[i % firstNames.length]
    const lastName = lastNames[i % lastNames.length]
    employees.push({
      id: `emp-${i + 1}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      department: departments[i % departments.length],
      position: positions[i % positions.length],
      salary: 50000 + Math.floor(Math.random() * 150000),
      joinDate: new Date(
        2020 + Math.floor(i / 20),
        i % 12,
        (i % 28) + 1
      ).toISOString(),
      status: statuses[i % statuses.length],
      phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      createdAt: new Date(
        2020 + Math.floor(i / 20),
        i % 12,
        (i % 28) + 1
      ).toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }
  return employees
}

// In-memory store for employees
const employeesStore: Employee[] = generateMockEmployees()

// Mock agents data with tasks (for workload dashboard)
const mockAgents = [
  {
    id: 'agent-1',
    name: 'Alice',
    role: 'Frontend',
    status: 'active',
    activeTasksCount: 3,
    totalEstimatedHours: 20,
  },
  {
    id: 'agent-2',
    name: 'Bob',
    role: 'Backend',
    status: 'active',
    activeTasksCount: 2,
    totalEstimatedHours: 15,
  },
  {
    id: 'agent-3',
    name: 'Charlie',
    role: 'DevOps',
    status: 'active',
    activeTasksCount: 4,
    totalEstimatedHours: 35,
  },
  {
    id: 'agent-4',
    name: 'Diana',
    role: 'Frontend',
    status: 'active',
    activeTasksCount: 1,
    totalEstimatedHours: 8,
  },
]

const SPRINT_CAPACITY = 40

// In-memory store for teams
const teamsStore: Team[] = []

// In-memory store for agents
const agentsStore: Agent[] = generateMockAgents()

// In-memory store for users is initialized below after function definition

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

// In-memory store for tasks with 1000+ seed data
const tasksStore: Task[] = generateMockTasks()

function getTaskIdCounter(): number {
  const maxId = tasksStore.reduce((max, task) => {
    const num = parseInt(task.id.replace('task-', ''), 10)
    return num > max ? num : max
  }, 0)
  return maxId + 1
}

// Generate mock sprints data
function generateMockSprints(): Sprint[] {
  const statuses = ['planning', 'active', 'completed'] as const
  const sprints: Sprint[] = []

  for (let i = 1; i <= 5; i++) {
    sprints.push({
      id: `sprint-${i}`,
      name: `Sprint ${i}`,
      status: statuses[i % statuses.length],
      goals: `Sprint ${i} goals and objectives`,
      tasks: [],
      estimatedPoints: 40 + i * 10,
      taskCount: 15 + i * 5,
      completedCount: i * 3,
      createdAt: new Date(Date.now() - (6 - i) * 14 * 24 * 60 * 60 * 1000).toISOString(),
      startDate: new Date(Date.now() - (6 - i) * 14 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: i < 3 ? new Date(Date.now() + (3 - i) * 14 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    })
  }

  return sprints
}

// In-memory store for sprints
const sprintsStore: Sprint[] = generateMockSprints()

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

// Generate mock users data
function generateMockUsers(): User[] {
  return [
    {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Frontend Developer',
      status: 'active',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'Backend Developer',
      status: 'active',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'DevOps Engineer',
      status: 'active',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-4',
      name: 'Alice Williams',
      email: 'alice@example.com',
      role: 'Product Manager',
      status: 'active',
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
}

// Generate mock projects data
function generateMockProjects(): Project[] {
  return [
    {
      id: 'project-1',
      name: 'AI Dev Team Simulation',
      description: 'Simulation platform for AI-driven development teams',
      status: 'active',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'project-2',
      name: 'Sprint Planning Dashboard',
      description: 'Dashboard for sprint planning and management',
      status: 'active',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'project-3',
      name: 'Legacy System Modernization',
      description: 'Modernization of legacy backend systems',
      status: 'active',
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'project-4',
      name: 'Mobile App Release',
      description: 'Mobile application for team collaboration',
      status: 'completed',
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

// In-memory stores for users and projects
const usersStore: User[] = generateMockUsers()
const projectsStore: Project[] = generateMockProjects()

// Simulation configuration for mutations
const mutationSimulation = {
  delayMs: 800, // Simulate network delay
  failureRate: 0.3, // 30% chance of failure on first attempt
  failureCountByEndpoint: new Map<string, number>(), // Track failures per endpoint
}

function shouldFailMutation(endpoint: string): boolean {
  const failCount = mutationSimulation.failureCountByEndpoint.get(endpoint) || 0
  // Fail on first attempt, succeed on retry
  if (failCount === 0 && Math.random() < mutationSimulation.failureRate) {
    mutationSimulation.failureCountByEndpoint.set(endpoint, failCount + 1)
    return true
  }
  // Reset on success
  mutationSimulation.failureCountByEndpoint.set(endpoint, 0)
  return false
}

async function simulateDelay() {
  return new Promise((resolve) => {
    setTimeout(resolve, mutationSimulation.delayMs)
  })
}

// Generate agent history data
function generateAgentHistory(agentId: string): HistoryEntry[] {
  const types = ['task_completed', 'task_started', 'decision_made', 'error_encountered', 'review_requested', 'code_merged'] as const
  const activities = [
    { title: 'Completed feature implementation', description: 'Successfully finished implementing user authentication module' },
    { title: 'Started code review', description: 'Reviewing PR #245 for API optimization' },
    { title: 'Fixed critical bug', description: 'Resolved memory leak in data processing pipeline' },
    { title: 'Merged pull request', description: 'Merged feature branch into main after 3 approvals' },
    { title: 'Submitted for review', description: 'Code review requested for refactoring PR' },
    { title: 'Encountered dependency issue', description: 'Blocked on external library version conflict' },
    { title: 'Optimized database query', description: 'Improved query performance by 45%' },
    { title: 'Written test suite', description: 'Added 50+ new unit tests for core modules' },
    { title: 'Updated documentation', description: 'Documented new API endpoints and usage examples' },
    { title: 'Deployed to production', description: 'Successfully deployed version 2.1.0' },
  ]

  const entries: HistoryEntry[] = []
  const now = Date.now()

  for (let i = 0; i < 12; i++) {
    const activity = activities[i % activities.length]
    entries.push({
      id: `history-${agentId}-${i}`,
      agentId,
      type: types[i % types.length],
      title: activity.title,
      description: activity.description,
      timestamp: new Date(now - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        duration: Math.floor(Math.random() * 480) + 60, // 1-8 hours
        status: i % 3 === 0 ? 'success' : 'in-progress',
      },
    })
  }

  return entries
}
export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),

  // Employees endpoints
  http.get('/api/employees', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const department = url.searchParams.get('department')
    const status = url.searchParams.get('status')
    const sortBy = url.searchParams.get('sortBy') || 'firstName'
    const sortOrder = url.searchParams.get('sortOrder') || 'asc'
    const pageIndex = parseInt(url.searchParams.get('pageIndex') || '0', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '25', 10)

    let filteredEmployees = [...employeesStore]

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      filteredEmployees = filteredEmployees.filter((emp) =>
        emp.firstName.toLowerCase().includes(searchLower) ||
        emp.lastName.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower) ||
        emp.position.toLowerCase().includes(searchLower)
      )
    }

    // Filter by department
    if (department) {
      filteredEmployees = filteredEmployees.filter(
        (emp) => emp.department === department
      )
    }

    // Filter by status
    if (status) {
      filteredEmployees = filteredEmployees.filter(
        (emp) => emp.status === status
      )
    }

    // Sorting
    const validSortFields = [
      'id',
      'firstName',
      'lastName',
      'email',
      'department',
      'position',
      'salary',
      'status',
      'joinDate',
    ]
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'firstName'

    filteredEmployees.sort((a, b) => {
      const aValue = a[validSortBy as keyof Employee] ?? ''
      const bValue = b[validSortBy as keyof Employee] ?? ''

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
    const paginatedEmployees = filteredEmployees.slice(start, end)

    return HttpResponse.json({
      data: paginatedEmployees,
      total: filteredEmployees.length,
      pageIndex,
      pageSize,
    })
  }),

  // Users endpoints
  http.get('/api/users', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const sortBy = url.searchParams.get('sortBy') || 'name'
    const sortOrder = url.searchParams.get('sortOrder') || 'asc'
    const pageIndex = parseInt(url.searchParams.get('pageIndex') || '0', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '25', 10)

    let filteredUsers = [...usersStore]

    // Filter by name or email
    if (search) {
      const searchLower = search.toLowerCase()
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      )
    }

    // Sorting
    const validSortFields = ['id', 'name', 'email', 'role', 'status', 'createdAt']
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'name'

    filteredUsers.sort((a, b) => {
      const aValue = a[validSortBy as keyof typeof a] ?? ''
      const bValue = b[validSortBy as keyof typeof b] ?? ''

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
    const paginatedUsers = filteredUsers.slice(start, end)

    return HttpResponse.json({
      data: paginatedUsers,
      total: filteredUsers.length,
      pageIndex,
      pageSize,
    })
  }),

  http.get('/api/users/:id', ({ params }) => {
    const { id } = params
    const user = usersStore.find((u) => u.id === id)

    if (!user) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(user)
  }),

  // Projects endpoints
  http.get('/api/projects', () => {
    return HttpResponse.json(projectsStore)
  }),

  http.get('/api/projects/:id', ({ params }) => {
    const { id } = params
    const project = projectsStore.find((p) => p.id === id)

    if (!project) {
      return HttpResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(project)
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
    // Return agents with capacity information
    const agentsWithCapacity = agentsStore.map((agent) => {
      // Count current tasks for this agent
      const currentTaskCount = tasksStore.filter(
        (task) => task.assignee === agent.name && task.status !== 'done'
      ).length
      const maxCapacity = 8 // Max tasks per agent
      const availableSlots = Math.max(0, maxCapacity - currentTaskCount)

      return {
        ...agent,
        currentTaskCount,
        maxCapacity,
        availableSlots,
      }
    })

    return HttpResponse.json(agentsWithCapacity)
  }),

  http.get('/api/agents/:id/history', ({ params }) => {
    const { id } = params
    const agent = agentsStore.find((a) => a.id === id)

    if (!agent) {
      return HttpResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    const history = generateAgentHistory(id as string)
    const response: AgentDetailResponse = {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      status: agent.status,
      history,
    }

    return HttpResponse.json(response)
  }),

  http.get('/api/tasks', ({ request }) => {
    const url = new URL(request.url)

    // Parse single and multi-value parameters
    const statusParam = url.searchParams.get('status')
    const statusValues = statusParam ? statusParam.split(',').filter(Boolean) : []

    const priority = url.searchParams.get('priority')
    const search = url.searchParams.get('search')
    const team = url.searchParams.get('team')
    const sprint = url.searchParams.get('sprint')
    const assignee = url.searchParams.get('assignee')
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    const pageIndex = parseInt(url.searchParams.get('pageIndex') || '0', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50', 10)
    const sortBy = url.searchParams.get('sortBy') || 'title'
    const sortOrder = url.searchParams.get('sortOrder') || 'asc'

    let filteredTasks = [...tasksStore]

    // Multi-status filtering
    if (statusValues.length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        statusValues.includes(task.status)
      )
    }

    if (priority) {
      filteredTasks = filteredTasks.filter((task) => task.priority === priority)
    }

    // Full-text search across title and description
    if (search) {
      const searchLower = search.toLowerCase()
      filteredTasks = filteredTasks.filter((task) => {
        const titleMatch = task.title.toLowerCase().includes(searchLower)
        // Search can be extended for description field when added to Task type
        return titleMatch
      })
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

    // Date range filtering
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      filteredTasks = filteredTasks.filter(
        (task) => new Date(task.createdAt) >= fromDate
      )
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      filteredTasks = filteredTasks.filter(
        (task) => new Date(task.createdAt) <= toDate
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
      page: pageIndex + 1,
      pageIndex,
      pageSize,
      totalPages: Math.ceil(filteredTasks.length / pageSize),
    })
  }),

  http.patch('/api/tasks/:id', async ({ request, params }) => {
    await simulateDelay()

    const { id } = params
    const body = (await request.json()) as UpdateTaskInput

    // Simulate occasional failures for testing retry mechanism
    if (shouldFailMutation(`PATCH /api/tasks/${id}`)) {
      return HttpResponse.json(
        { error: 'Failed to update task. Please try again.' },
        { status: 500 }
      )
    }

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

  http.get('/api/sprints/:id/metrics', ({ params }) => {
    const { id } = params
    const sprint = sprintsStore.find((s) => s.id === id)

    if (!sprint) {
      return HttpResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      )
    }

    // Get tasks for this sprint
    const sprintTasks = tasksStore.filter((task) => task.sprint === id)

    // Calculate metrics
    const totalPoints = sprint.estimatedPoints
    const completedPoints = sprintTasks
      .filter((task) => task.status === 'done')
      .reduce((sum, task) => sum + task.storyPoints, 0)
    const remainingPoints = totalPoints - completedPoints

    // Calculate days remaining (assume 14-day sprints, can be adjusted with startDate/endDate)
    const sprintDuration = 14
    const daysElapsed = Math.ceil(
      (Date.now() - new Date(sprint.createdAt).getTime()) / (24 * 60 * 60 * 1000)
    )
    const daysRemaining = Math.max(0, sprintDuration - daysElapsed)

    // Velocity is completed points
    const velocity = completedPoints

    // On-track: actual >= 90% of ideal
    const idealPoints = totalPoints * Math.max(0, 1 - daysElapsed / sprintDuration)
    const onTrack = completedPoints >= idealPoints * 0.9

    // Build burndown data
    const burndownData = []
    const startDate = new Date(sprint.createdAt)

    for (let day = 0; day <= sprintDuration; day++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(currentDate.getDate() + day)
      const dateStr = currentDate.toISOString().split('T')[0]

      // Calculate actual progress up to this day
      let actualPoints = 0
      sprintTasks
        .filter((task) => task.status === 'done')
        .filter((task) => new Date(task.updatedAt).toISOString().split('T')[0] <= dateStr)
        .forEach((task) => {
          actualPoints += task.storyPoints
        })

      // Ideal line: linear from totalPoints to 0
      const ideal = Math.max(0, totalPoints - (totalPoints / sprintDuration) * day)

      burndownData.push({
        day,
        ideal: Math.round(ideal * 100) / 100,
        actual: actualPoints,
        date: dateStr,
      })
    }

    return HttpResponse.json({
      sprint,
      metrics: {
        sprintId: id,
        totalPoints,
        completedPoints,
        remainingPoints,
        daysRemaining,
        daysElapsed,
        sprintDuration,
        velocity,
        onTrack,
        completionPercentage: Math.round((completedPoints / totalPoints) * 100),
      },
      burndownData,
    })
  }),

  http.get('/api/sprints/:id', ({ params }) => {
    const { id } = params
    const sprint = sprintsStore.find((s) => s.id === id)

    if (!sprint) {
      return HttpResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(sprint)
  }),

  http.get('/api/sprints/:id/tasks', ({ params }) => {
    const { id } = params
    const sprintTasks = tasksStore
      .filter((task) => task.sprint === id)
      .map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        assignee: task.assignee,
        priority: task.priority,
        sprintId: task.sprint,
      } as SprintTask))

    return HttpResponse.json(sprintTasks)
  }),

  http.patch('/api/sprints/:id', async ({ request, params }) => {
    const { id } = params
    const body = await request.json() as Partial<typeof sprintsStore[0]>

    const sprintIndex = sprintsStore.findIndex((s) => s.id === id)
    if (sprintIndex === -1) {
      return HttpResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      )
    }

    const updatedSprint = { ...sprintsStore[sprintIndex], ...body }
    sprintsStore[sprintIndex] = updatedSprint
    return HttpResponse.json(updatedSprint)
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
    await simulateDelay()

    const body = (await request.json()) as CreateTaskPayload

    // Simulate occasional failures for testing retry mechanism
    if (shouldFailMutation('POST /api/tasks')) {
      return HttpResponse.json(
        { error: 'Failed to create task. Please try again.' },
        { status: 500 }
      )
    }

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
      assignee: body.assignedAgent || 'Unassigned',
      team: body.team || 'general',
      status: (body.status as TaskStatus) || 'backlog',
      priority: (body.priority as TaskPriority) || 'medium',
      storyPoints: 0,
      sprint: body.sprint || 'sprint-1',
      order: 0,
      estimatedHours: body.estimatedHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dependsOn: [],
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

  http.get('/api/agents/:id/analytics', ({ params }) => {
    const { id } = params
    const agent = agentsStore.find((a) => a.id === id)

    if (!agent) {
      return HttpResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Generate analytics metrics for the agent
    const totalTasks = Math.floor(Math.random() * 100) + 50
    const completedTasks = Math.floor(totalTasks * (0.6 + Math.random() * 0.4))
    const failedTasks = Math.floor(totalTasks * 0.15)

    return HttpResponse.json({
      agentId: agent.id,
      agentName: agent.name,
      agentRole: agent.role,
      metrics: {
        totalTasks,
        completedTasks,
        failedTasks,
        inProgressTasks: totalTasks - completedTasks - failedTasks,
        completionRate: ((completedTasks / totalTasks) * 100).toFixed(1),
        averageTimeToComplete: Math.floor(Math.random() * 480) + 120, // 2-8 hours in minutes
        errorRate: ((failedTasks / totalTasks) * 100).toFixed(1),
      },
    })
  }),

  http.get('/api/agents/:id/tasks', ({ params, request }) => {
    const { id } = params
    const url = new URL(request.url)
    const pageIndex = parseInt(url.searchParams.get('pageIndex') || '0', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10)
    const sprint = url.searchParams.get('sprint')
    const status = url.searchParams.get('status')

    const agent = agentsStore.find((a) => a.id === id)
    if (!agent) {
      return HttpResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Filter tasks for this agent - generate mock tasks with ~50-200 per agent
    let filteredTasks = tasksStore.filter((task) => {
      const taskAgentIndex = parseInt(task.id.match(/\d+/)?.[0] || '0', 10)
      const agentIdStr = typeof id === 'string' ? id : '0'
      const agentIndex = parseInt(agentIdStr.match(/\d+/)?.[0] || '0', 10)
      return taskAgentIndex % 50 === agentIndex % 50
    })

    if (sprint) {
      filteredTasks = filteredTasks.filter((task) => task.sprint === sprint)
    }

    if (status) {
      filteredTasks = filteredTasks.filter((task) => task.status === status)
    }

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

  http.put('/api/tasks/:id/dependencies', async ({ request, params }) => {
    const { id } = params
    const body = (await request.json()) as { dependsOn: string[] }

    const taskIndex = tasksStore.findIndex((task) => task.id === id)
    if (taskIndex === -1) {
      return HttpResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Validate that all dependency task IDs exist
    const invalidIds = body.dependsOn.filter(
      (depId) => !tasksStore.some((task) => task.id === depId)
    )
    if (invalidIds.length > 0) {
      return HttpResponse.json(
        { error: `Invalid task ID(s): ${invalidIds.join(', ')}` },
        { status: 400 }
      )
    }

    // Check for direct circular dependencies
    for (const depId of body.dependsOn) {
      const depTask = tasksStore.find((t) => t.id === depId)
      if (depTask?.dependsOn && depTask.dependsOn.includes(id as string)) {
        return HttpResponse.json(
          {
            error: `Circular dependency detected: ${id} depends on ${depId}, but ${depId} depends on ${id}`,
          },
          { status: 400 }
        )
      }
    }

    const updatedTask: Task = {
      ...tasksStore[taskIndex],
      dependsOn: body.dependsOn,
      updatedAt: new Date().toISOString(),
    }

    tasksStore[taskIndex] = updatedTask
    return HttpResponse.json(updatedTask)
  }),

  http.get('/api/agents/:id/workload', ({ params }) => {
    const agent = mockAgents.find((a) => a.id === params.id)
    if (!agent) {
      return HttpResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const utilizationPercent = (agent.totalEstimatedHours / SPRINT_CAPACITY) * 100

    return HttpResponse.json({
      agentId: agent.id,
      name: agent.name,
      role: agent.role,
      status: agent.status,
      activeTasksCount: agent.activeTasksCount,
      totalEstimatedHours: agent.totalEstimatedHours,
      sprintCapacity: SPRINT_CAPACITY,
      utilizationPercent: Math.round(utilizationPercent * 10) / 10,
    })
  }),

  http.delete('/api/tasks/:id', async ({ params }) => {
    await simulateDelay()

    const { id } = params

    // Simulate occasional failures for testing retry mechanism
    if (shouldFailMutation(`DELETE /api/tasks/${id}`)) {
      return HttpResponse.json(
        { error: 'Failed to delete task. Please try again.' },
        { status: 500 }
      )
    }

    const taskIndex = tasksStore.findIndex((task) => task.id === id)

    if (taskIndex === -1) {
      return HttpResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const deletedTask = tasksStore[taskIndex]
    tasksStore.splice(taskIndex, 1)

    return HttpResponse.json(deletedTask)
  }),

  // Agent Profile Form submission
  http.post('/api/agents/profile', async ({ request }) => {
    const body = await request.json()

    // Simulate validation
    if (!body.name || !body.email || !body.role) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Simulate email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return HttpResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Simulate successful submission
    return HttpResponse.json(
      {
        success: true,
        message: 'Agent profile updated successfully',
        data: {
          id: `agent-${Date.now()}`,
          ...body,
          updatedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  }),

  // Sprint Configuration Form submission
  http.post('/api/sprints/configure', async ({ request }) => {
    const body = await request.json()

    // Simulate validation
    if (!body.name || !body.startDate || !body.endDate || !body.duration) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate date range
    const start = new Date(body.startDate)
    const end = new Date(body.endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays + 1 !== body.duration) {
      return HttpResponse.json(
        {
          error: `End date must be ${body.duration - 1} days after start date`,
        },
        { status: 400 }
      )
    }

    // Simulate successful submission
    return HttpResponse.json(
      {
        success: true,
        message: 'Sprint configured successfully',
        data: {
          id: `sprint-${Date.now()}`,
          ...body,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  }),

  // User creation
  http.post('/api/users', async ({ request }) => {
    const body = await request.json() as { name: string; email: string; role: string }

    // Validate required fields
    if (!body.name || !body.email || !body.role) {
      return HttpResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return HttpResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'user', 'viewer'].includes(body.role)) {
      return HttpResponse.json(
        { message: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check for duplicate email
    if (usersStore.some((u) => u.email === body.email)) {
      return HttpResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      )
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    }

    usersStore.push(newUser)
    return HttpResponse.json(newUser, { status: 201 })
  }),

  // User update
  http.put('/api/users/:id', async ({ request, params }) => {
    const { id } = params
    const body = await request.json() as Partial<Omit<User, 'id' | 'createdAt'>>

    const userIndex = usersStore.findIndex((u) => u.id === id)
    if (userIndex === -1) {
      return HttpResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Validate email if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return HttpResponse.json(
          { message: 'Invalid email format' },
          { status: 400 }
        )
      }

      // Check for duplicate email (excluding current user)
      if (usersStore.some((u) => u.email === body.email && u.id !== id)) {
        return HttpResponse.json(
          { message: 'User with this email already exists' },
          { status: 400 }
        )
      }
    }

    // Validate role if provided
    if (body.role && !['admin', 'user', 'viewer'].includes(body.role)) {
      return HttpResponse.json(
        { message: 'Invalid role' },
        { status: 400 }
      )
    }

    const updatedUser: User = {
      ...usersStore[userIndex],
      ...body,
    }

    usersStore[userIndex] = updatedUser
    return HttpResponse.json(updatedUser)
  }),

  // Form validation endpoints
  http.post('/api/validate/email', async ({ request }) => {
    const body = (await request.json()) as { email: string }

    // Check if email already exists
    const exists = usersStore.some((u) => u.email === body.email)

    return HttpResponse.json({
      available: !exists,
      message: exists ? 'Email already in use' : undefined,
    })
  }),

  http.post('/api/validate/username', async ({ request }) => {
    const body = (await request.json()) as { username: string }

    // Mock list of taken usernames
    const takenUsernames = ['admin', 'root', 'test', 'demo']
    const isTaken = takenUsernames.includes(body.username.toLowerCase())

    return HttpResponse.json({
      available: !isTaken,
      message: isTaken ? 'Username already taken' : undefined,
    })
  }),

  // Virtualized Table endpoint - optimized for large datasets
  // Supports filtering, sorting, and pagination for 1000+ rows
  http.get('/api/virtualized-tasks', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const priority = url.searchParams.get('priority')
    const search = url.searchParams.get('search')
    const team = url.searchParams.get('team')
    const assignee = url.searchParams.get('assignee')
    const pageIndex = parseInt(url.searchParams.get('pageIndex') || '0', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '100', 10)
    const sortBy = url.searchParams.get('sortBy') || 'id'
    const sortOrder = url.searchParams.get('sortOrder') || 'asc'

    let filteredTasks = [...tasksStore]

    // Apply filters
    if (status) {
      filteredTasks = filteredTasks.filter((task) => task.status === status)
    }

    if (priority) {
      filteredTasks = filteredTasks.filter((task) => task.priority === priority)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.id.toLowerCase().includes(searchLower)
      )
    }

    if (team) {
      filteredTasks = filteredTasks.filter((task) => task.team === team)
    }

    if (assignee) {
      filteredTasks = filteredTasks.filter((task) => task.assignee === assignee)
    }

    // Apply sorting
    const validSortFields = Object.keys({} as Task)
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'id'

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

    // Apply pagination
    const start = pageIndex * pageSize
    const end = start + pageSize
    const paginatedTasks = filteredTasks.slice(start, end)

    return HttpResponse.json({
      data: paginatedTasks,
      total: filteredTasks.length,
      pageIndex,
      pageSize,
      hasNextPage: end < filteredTasks.length,
    })
  }),

  // Form submission handlers (React Hook Form)
  http.post('/api/forms/user-profile', async ({ request }) => {
    const body = await request.json() as {
      name: string
      email: string
      bio?: string
    }

    // Simulate validation
    if (!body.name || !body.email) {
      return HttpResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Simulate email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return HttpResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Simulate successful submission
    return HttpResponse.json(
      {
        success: true,
        message: 'User profile updated successfully',
        data: {
          id: `user-${Date.now()}`,
          ...body,
          updatedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  }),

  http.patch('/api/forms/user-profile/:id', async ({ request, params }) => {
    const { id } = params
    const body = await request.json() as Partial<{
      name: string
      email: string
      bio: string
    }>

    // Validate email if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return HttpResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // Simulate successful update
    return HttpResponse.json(
      {
        success: true,
        message: 'User profile updated successfully',
        data: {
          id,
          ...body,
          updatedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  }),

  // User profile GET endpoint
  http.get('/api/user-profiles/:id', ({ params }) => {
    const { id } = params
    const user = usersStore.find((u) => u.id === id)

    if (!user) {
      return HttpResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: '',
      avatarUrl: undefined,
      createdAt: user.createdAt,
      updatedAt: new Date().toISOString(),
    })
  }),

  // User profile UPDATE endpoint
  http.put('/api/user-profiles/:id', async ({ request, params }) => {
    const { id } = params
    const body = await request.json() as {
      name?: string
      email?: string
      bio?: string
      avatarUrl?: string
      role?: string
    }

    const userIndex = usersStore.findIndex((u) => u.id === id)
    if (userIndex === -1) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate name if provided
    if (body.name) {
      if (body.name.length < 2) {
        return HttpResponse.json(
          { error: 'Name must be at least 2 characters' },
          { status: 400 }
        )
      }
      if (body.name.length > 100) {
        return HttpResponse.json(
          { error: 'Name must not exceed 100 characters' },
          { status: 400 }
        )
      }
    }

    // Validate email if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return HttpResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      // Check for duplicate email (excluding current user)
      if (usersStore.some((u) => u.email === body.email && u.id !== id)) {
        return HttpResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        )
      }
    }

    // Validate bio if provided
    if (body.bio && body.bio.length > 500) {
      return HttpResponse.json(
        { error: 'Bio must not exceed 500 characters' },
        { status: 400 }
      )
    }

    // Validate avatar URL if provided
    if (body.avatarUrl) {
      try {
        new URL(body.avatarUrl)
      } catch {
        return HttpResponse.json(
          { error: 'Avatar URL must be a valid URL' },
          { status: 400 }
        )
      }
    }

    // Validate role if provided
    if (body.role && !['admin', 'user', 'viewer'].includes(body.role)) {
      return HttpResponse.json(
        { error: 'Invalid role selected' },
        { status: 400 }
      )
    }

    // Update user
    const updatedUser = {
      ...usersStore[userIndex],
      ...(body.name && { name: body.name }),
      ...(body.email && { email: body.email }),
      ...(body.role && { role: body.role }),
    }

    usersStore[userIndex] = updatedUser

    return HttpResponse.json(
      {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: body.bio || '',
        avatarUrl: body.avatarUrl || undefined,
        createdAt: updatedUser.createdAt,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    )
  }),

  // Optimistic update and paginated query handlers
  ...optimisticUpdateHandlers,

  // Form submission handlers
  ...formSubmissionHandlers,
]

export const allHandlers = [...handlers, ...paginatedHandlers]

// Paginated endpoints for infinite scroll
const paginatedItemsStore: Array<{ id: string; title: string; description: string; createdAt: string }> = Array.from(
  { length: 47 },
  (_, i) => ({
    id: `item-${i + 1}`,
    title: `Item ${i + 1}`,
    description: `Description for item ${i + 1}`,
    createdAt: new Date(Date.now() - (47 - i) * 1000 * 60).toISOString(),
  })
).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

export const paginatedHandlers = [
  // Paginated items endpoint with cursor-based pagination
  http.get('/api/items/paginated', ({ request }) => {
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '10'), 50)

    // Find the starting index
    let startIndex = 0
    if (cursor) {
      const cursorIndex = paginatedItemsStore.findIndex((item) => item.id === cursor)
      if (cursorIndex === -1) {
        return HttpResponse.json(
          { message: 'Invalid cursor' },
          { status: 400 }
        )
      }
      startIndex = cursorIndex + 1
    }

    const items = paginatedItemsStore.slice(startIndex, startIndex + pageSize)
    const hasNextPage = startIndex + pageSize < paginatedItemsStore.length
    const endCursor = items.length > 0 ? items[items.length - 1].id : null

    return HttpResponse.json({
      data: items,
      pageInfo: {
        hasNextPage,
        endCursor: hasNextPage ? endCursor : null,
        startCursor: items.length > 0 ? items[0].id : null,
      },
    })
  }),

  // Offset-based paginated endpoint
  http.get('/api/items/offset', ({ request }) => {
    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '10'), 50)

    const startIndex = (page - 1) * pageSize
    const items = paginatedItemsStore.slice(startIndex, startIndex + pageSize)
    const total = paginatedItemsStore.length
    const totalPages = Math.ceil(total / pageSize)

    return HttpResponse.json({
      data: items,
      pageInfo: {
        hasNextPage: page < totalPages,
        currentPage: page,
        totalPages,
        total,
      },
    })
  }),

  // Data table endpoint with filtering, sorting, and pagination
  http.get('/api/data-table', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const sortBy = url.searchParams.get('sortBy') || 'title'
    const sortOrder = url.searchParams.get('sortOrder') || 'asc'
    const pageIndex = parseInt(url.searchParams.get('pageIndex') || '0', 10)
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '10'), 100)

    let filteredItems = [...paginatedItemsStore]

    // Apply text search
    if (search) {
      const searchLower = search.toLowerCase()
      filteredItems = filteredItems.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower)
      )
    }

    // Apply sorting
    filteredItems.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title)
      } else if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return sortOrder === 'desc' ? -comparison : comparison
    })

    // Apply pagination
    const start = pageIndex * pageSize
    const end = start + pageSize
    const paginatedData = filteredItems.slice(start, end)

    return HttpResponse.json({
      data: paginatedData,
      total: filteredItems.length,
      pageIndex,
      pageSize,
      hasNextPage: end < filteredItems.length,
    })
  }),

  // Auth endpoints for form submission
  http.post('/api/auth/login', async ({ request }) => {
    const data = await request.json() as { email: string; password: string }

    // Validate required fields
    if (!data.email || !data.password) {
      return HttpResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Mock successful login
    if (data.email && data.password) {
      return HttpResponse.json({
        success: true,
        user: {
          id: 'user-123',
          email: data.email,
          name: 'John Doe',
        },
        token: 'mock-token-123',
      })
    }

    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const data = await request.json() as Record<string, any>

    // Validate required fields
    const errors: Record<string, string> = {}

    if (!data.firstName?.trim()) {
      errors.firstName = 'First name is required'
    }

    if (!data.lastName?.trim()) {
      errors.lastName = 'Last name is required'
    }

    if (!data.email?.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Invalid email address'
    }

    if (!data.username?.trim()) {
      errors.username = 'Username is required'
    } else if (data.username.length < 3) {
      errors.username = 'Username must be at least 3 characters'
    }

    if (!data.password?.trim()) {
      errors.password = 'Password is required'
    } else if (data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (!data.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to terms'
    }

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      return HttpResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }

    // Mock successful registration
    return HttpResponse.json({
      success: true,
      user: {
        id: 'user-' + Date.now(),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
      },
    })
  }),

  http.post('/api/auth/check-email', async ({ request }) => {
    const data = await request.json() as { email: string }

    // Mock email availability check
    // Simulate some emails as already taken
    const takenEmails = [
      'john@example.com',
      'admin@example.com',
      'test@example.com',
    ]

    const available = !takenEmails.includes(data.email?.toLowerCase() || '')

    return HttpResponse.json({ available })
  }),

  http.post('/api/auth/check-username', async ({ request }) => {
    const data = await request.json() as { username: string }

    // Mock username availability check
    // Simulate some usernames as already taken
    const takenUsernames = [
      'admin',
      'user',
      'test',
      'john',
      'john_doe',
    ]

    const available = !takenUsernames.includes(
      data.username?.toLowerCase() || ''
    )

    return HttpResponse.json({ available })
  }),

  // Task Monitoring Endpoint
  // Provides real-time task monitoring with smart polling support
  http.get('/api/task-monitor', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const team = url.searchParams.get('team')
    const assignee = url.searchParams.get('assignee')

    let monitoredTasks = [...tasksStore]

    if (status) {
      monitoredTasks = monitoredTasks.filter((task) => task.status === status)
    }

    if (team) {
      monitoredTasks = monitoredTasks.filter((task) => task.team === team)
    }

    if (assignee) {
      monitoredTasks = monitoredTasks.filter((task) => task.assignee === assignee)
    }

    // Return tasks with real-time simulation (shuffle based on request time)
    // This simulates live updates in monitoring scenario
    const monitored = monitoredTasks.map((task) => ({
      ...task,
      // Update timestamp to reflect live polling
      updatedAt: new Date().toISOString(),
      // Simulate progress updates in 'in-progress' tasks
      ...(task.status === 'in-progress' && {
        _polledAt: new Date().toISOString(),
      }),
    }))

    return HttpResponse.json(monitored)
  }),

  // Task assignment endpoints (both formats supported)
  http.post('/api/tasks/:id/assign', async ({ request, params }) => {
    await simulateDelay()

    const { id } = params
    const body = (await request.json()) as { agentId?: string; agent?: string; priority?: number; estimatedHours?: number }

    // Simulate 10% failure rate for testing error handling
    if (shouldFailMutation(`POST /api/tasks/${id}/assign`)) {
      return HttpResponse.json(
        { error: 'Failed to assign task. Agent may be at capacity.' },
        { status: 500 }
      )
    }

    const taskIndex = tasksStore.findIndex((task) => task.id === id)
    if (taskIndex === -1) {
      return HttpResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Support both agentId and agent formats
    const agentId = body.agentId || body.agent
    if (!agentId) {
      return HttpResponse.json(
        { error: 'Agent ID or agent name is required' },
        { status: 400 }
      )
    }

    // Find agent to get name for assignee field
    const agent = agentsStore.find((a) => a.id === agentId || a.name === agentId)
    const assigneeName = agent ? agent.name : agentId

    // Convert priority number to priority string (optional)
    const priorityMap: Record<number, TaskPriority> = {
      1: 'high',
      2: 'medium',
      3: 'low',
      4: 'low',
    }

    const updatedTask: Task = {
      ...tasksStore[taskIndex],
      assignee: assigneeName,
      ...(body.priority && { priority: priorityMap[body.priority] || 'low' }),
      ...(body.estimatedHours && { estimatedHours: body.estimatedHours }),
      updatedAt: new Date().toISOString(),
    }

    tasksStore[taskIndex] = updatedTask

    // Return in the format expected by useTaskAssignment
    return HttpResponse.json(
      {
        success: true,
        data: updatedTask,
        message: `Task assigned to ${assigneeName}`,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  }),

  // Task unassignment endpoint
  http.post('/api/tasks/:id/unassign', async ({ request, params }) => {
    await simulateDelay()

    const { id } = params

    // Simulate 10% failure rate for testing error handling
    if (shouldFailMutation(`POST /api/tasks/${id}/unassign`)) {
      return HttpResponse.json(
        { error: 'Failed to unassign task.' },
        { status: 500 }
      )
    }

    const taskIndex = tasksStore.findIndex((task) => task.id === id)
    if (taskIndex === -1) {
      return HttpResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const updatedTask: Task = {
      ...tasksStore[taskIndex],
      assignee: '',
      updatedAt: new Date().toISOString(),
    }

    tasksStore[taskIndex] = updatedTask

    // Return in the format expected by useTaskAssignment
    return HttpResponse.json(
      {
        success: true,
        data: updatedTask,
        message: 'Task unassigned',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  }),

  // Batch task assignment endpoint
  http.post('/api/tasks/assign-batch', async ({ request }) => {
    await simulateDelay()

    const body = (await request.json()) as {
      taskIds: string[]
      agentId: string
      priority: number
      estimatedHours?: number
    }

    const { taskIds, agentId, priority, estimatedHours } = body

    // Validate input
    if (!taskIds || taskIds.length === 0) {
      return HttpResponse.json(
        { error: 'At least one task must be selected' },
        { status: 400 }
      )
    }

    if (!agentId) {
      return HttpResponse.json(
        { error: 'Agent is required' },
        { status: 400 }
      )
    }

    // Find the agent to check capacity
    const agent = agentsStore.find((a) => a.id === agentId || a.name === agentId)
    if (!agent) {
      return HttpResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Check if agent can accept the tasks
    const currentTaskCount = tasksStore.filter(
      (task) => task.assignee === agent.name && task.status !== 'done'
    ).length
    const maxCapacity = 8
    const availableSlots = maxCapacity - currentTaskCount

    if (availableSlots < taskIds.length) {
      return HttpResponse.json(
        {
          error: `Agent can only accept ${availableSlots} more task(s). Maximum capacity is ${maxCapacity} active tasks.`,
        },
        { status: 400 }
      )
    }

    // Simulate 10% failure rate for testing error handling
    if (shouldFailMutation('POST /api/tasks/assign-batch')) {
      return HttpResponse.json(
        { error: 'Failed to assign tasks. Please try again.' },
        { status: 500 }
      )
    }

    // Convert priority number to priority string
    const priorityMap: Record<number, TaskPriority> = {
      1: 'high',
      2: 'medium',
      3: 'low',
    }

    // Update all tasks
    const updatedTasks: Task[] = []
    taskIds.forEach((taskId) => {
      const taskIndex = tasksStore.findIndex((task) => task.id === taskId)
      if (taskIndex !== -1) {
        const updatedTask: Task = {
          ...tasksStore[taskIndex],
          assignee: agent.name,
          priority: priorityMap[priority] || 'low',
          estimatedHours: estimatedHours,
          updatedAt: new Date().toISOString(),
        }
        tasksStore[taskIndex] = updatedTask
        updatedTasks.push(updatedTask)
      }
    })

    return HttpResponse.json(updatedTasks, { status: 200 })
  }),

  // Priority update endpoint
  http.patch('/api/tasks/:id/priority', async ({ request, params }) => {
    await simulateDelay()

    const { id } = params
    const body = (await request.json()) as { priority: number }

    // Simulate 10% failure rate for testing error handling
    if (shouldFailMutation(`PATCH /api/tasks/${id}/priority`)) {
      return HttpResponse.json(
        { error: 'Failed to update priority' },
        { status: 500 }
      )
    }

    const taskIndex = tasksStore.findIndex((task) => task.id === id)
    if (taskIndex === -1) {
      return HttpResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Convert priority number to priority string
    const priorityMap: Record<number, TaskPriority> = {
      1: 'high',
      2: 'medium',
      3: 'low',
      4: 'low',
    }

    const updatedTask: Task = {
      ...tasksStore[taskIndex],
      priority: priorityMap[body.priority] || 'low',
      updatedAt: new Date().toISOString(),
    }

    tasksStore[taskIndex] = updatedTask
    return HttpResponse.json(updatedTask, { status: 200 })
  }),

  // Task completion endpoint
  http.post('/api/tasks/:id/complete', async ({ request, params }) => {
    await simulateDelay()

    const { id } = params

    // Simulate 10% failure rate for testing error handling
    if (shouldFailMutation(`POST /api/tasks/${id}/complete`)) {
      return HttpResponse.json(
        { error: 'Failed to complete task' },
        { status: 500 }
      )
    }

    const taskIndex = tasksStore.findIndex((task) => task.id === id)
    if (taskIndex === -1) {
      return HttpResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const updatedTask: Task = {
      ...tasksStore[taskIndex],
      status: 'done',
      updatedAt: new Date().toISOString(),
    }

    tasksStore[taskIndex] = updatedTask
    return HttpResponse.json(updatedTask, { status: 200 })
  }),

  // Task History endpoints
  http.get('/api/tasks/:id/history', ({ params }) => {
    const { id } = params

    // Check if task exists
    const task = tasksStore.find((t) => t.id === id)
    if (!task) {
      return HttpResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Generate mock history entries
    const history = [
      {
        id: `history-${id}-1`,
        taskId: id,
        actor: 'Alice',
        field: 'status',
        previousValue: 'backlog',
        newValue: 'in-progress',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: `history-${id}-2`,
        taskId: id,
        actor: 'Bob',
        field: 'priority',
        previousValue: 'normal',
        newValue: 'high',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: `history-${id}-3`,
        taskId: id,
        actor: 'Alice',
        field: 'assignee',
        previousValue: 'Bob',
        newValue: 'Carol',
        createdAt: new Date(Date.now() - 900000).toISOString(),
      },
    ]

    return HttpResponse.json(history)
  }),

  // Task Comments endpoints
  http.get('/api/tasks/:id/comments', ({ params }) => {
    const { id } = params

    // Check if task exists
    const task = tasksStore.find((t) => t.id === id)
    if (!task) {
      return HttpResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Generate mock comments
    const comments = [
      {
        id: `comment-${id}-1`,
        taskId: id,
        author: 'Alice',
        content: 'This task looks straightforward. I can start on it tomorrow.',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: `comment-${id}-2`,
        taskId: id,
        author: 'Bob',
        content: 'Please make sure to test it thoroughly before marking it as done. The *edge cases* are tricky here.',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: `comment-${id}-3`,
        taskId: id,
        author: 'Carol',
        content: 'I\`ve added the needed documentation. Let me know if anything is unclear!',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ]

    return HttpResponse.json(comments)
  }),

  http.post('/api/tasks/:id/comments', async ({ request, params }) => {
    await simulateDelay()

    const { id } = params
    const { content } = (await request.json()) as { content: string }

    // Check if task exists
    const task = tasksStore.find((t) => t.id === id)
    if (!task) {
      return HttpResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Validate content
    if (!content || content.trim() === '') {
      return HttpResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Simulate 5% failure rate
    if (shouldFailMutation(`POST /api/tasks/${id}/comments`)) {
      return HttpResponse.json(
        { error: 'Failed to add comment' },
        { status: 500 }
      )
    }

    // Create new comment
    const newComment = {
      id: `comment-${Date.now()}`,
      taskId: id,
      author: 'Current User',
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return HttpResponse.json(newComment, { status: 201 })
  }),

  // Sprint Dashboard endpoints
  http.get('/api/sprints/:id/summary', ({ params }) => {
    const { id } = params
    const sprint = sprintsStore.find((s) => s.id === id)

    if (!sprint) {
      return HttpResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      )
    }

    // Get tasks for this sprint
    const sprintTasks = tasksStore.filter((task) => task.sprint === id)

    // Calculate summary stats
    const totalTasks = sprintTasks.length
    const completedTasks = sprintTasks.filter((task) => task.status === 'done').length
    const inProgressTasks = sprintTasks.filter((task) => task.status === 'in-progress').length

    return HttpResponse.json({
      sprintId: id,
      totalTasks,
      completedTasks,
      inProgressTasks,
      remainingTasks: totalTasks - completedTasks,
      completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    })
  }),

  http.get('/api/sprints/:id/tasks/summary', ({ params }) => {
    const { id } = params
    const sprint = sprintsStore.find((s) => s.id === id)

    if (!sprint) {
      return HttpResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      )
    }

    // Get tasks grouped by status
    const sprintTasks = tasksStore.filter((task) => task.sprint === id)

    const tasksByStatus = {
      backlog: sprintTasks.filter((task) => task.status === 'backlog'),
      'in-progress': sprintTasks.filter((task) => task.status === 'in-progress'),
      'in-review': sprintTasks.filter((task) => task.status === 'in-review'),
      done: sprintTasks.filter((task) => task.status === 'done'),
    }

    return HttpResponse.json(tasksByStatus)
  }),

  http.get('/api/sprints/:id/agents/workload', ({ params }) => {
    const { id } = params
    const sprint = sprintsStore.find((s) => s.id === id)

    if (!sprint) {
      return HttpResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      )
    }

    // Get tasks for this sprint and group by assignee
    const sprintTasks = tasksStore.filter((task) => task.sprint === id)

    const workloadMap: Record<string, { agent: string; taskCount: number; completedCount: number }> = {}

    sprintTasks.forEach((task) => {
      if (!workloadMap[task.assignee]) {
        workloadMap[task.assignee] = {
          agent: task.assignee,
          taskCount: 0,
          completedCount: 0,
        }
      }
      workloadMap[task.assignee].taskCount++
      if (task.status === 'done') {
        workloadMap[task.assignee].completedCount++
      }
    })

    const workload = Object.values(workloadMap).sort((a, b) => b.taskCount - a.taskCount)

    return HttpResponse.json(workload)
  }),

  ...metricsHandlers,
  ...bulkOperationHandlers,
  ...agentCapacityHandlers,
  ...taskQueueHandlers,
  ...taskHandlers,
  ...sprintHandlers,
  ...agentTaskQueueHandlers,
  ...sprintAnalyticsHandlers,
  ...agentStatusHandlers,
  ...permissionHandlers,
  ...agentManagementHandlers,
  ...notificationHandlers,
  ...taskExecutionHandlers,
  ...agentPresenceHandlers,
  ...agentAvailabilityHandlers,
  ...workloadHandlers,
  ...activityHandlers,
  ...agentAnalyticsHandlers,
  ...templateHandlers,
  ...analyticsHandlers,
  ...searchHandlers,
  ...dependencyHandlers,
]
