/**
 * MSW Handlers for Sprint Management Dashboard
 *
 * Mock API endpoints for sprint data:
 * - Sprint list with pagination and filtering
 * - Sprint details with tasks
 * - Burndown data for charts
 * - Team capacity allocation data
 */

import { http, HttpResponse } from 'msw'
import type {
  Sprint,
  SprintTask,
  BurndownDataPoint,
  TeamCapacity,
  TeamMemberCapacity,
  SprintReport,
  SprintHistoryEvent,
} from '../../types/sprint'

interface SprintsListResponse {
  data: Sprint[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * In-memory store for sprint versions
 * In production, this would be persisted in database
 */
const sprintVersionStore: Record<string, number> = {
  'sprint-1': 1,
  'sprint-2': 1,
  'sprint-3': 1,
}

/**
 * Generate mock sprint data
 */
function generateSprints(): Sprint[] {
  const sprints: Sprint[] = [
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
      version: sprintVersionStore['sprint-1'] || 1,
    },
    {
      id: 'sprint-2',
      name: 'Sprint 2 - API & Data Layer',
      status: 'active',
      goals: 'Build REST API with proper validation and error handling',
      tasks: ['task-6', 'task-7', 'task-8', 'task-9', 'task-10', 'task-11'],
      estimatedPoints: 45,
      taskCount: 6,
      completedCount: 3,
      createdAt: '2026-02-15T10:00:00Z',
      startDate: '2026-02-15T00:00:00Z',
      endDate: '2026-02-28T23:59:59Z',
      version: sprintVersionStore['sprint-2'] || 1,
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
      createdAt: '2026-02-28T10:00:00Z',
      startDate: '2026-03-01T00:00:00Z',
      endDate: '2026-03-14T23:59:59Z',
      version: sprintVersionStore['sprint-3'] || 1,
    },
  ]

  return sprints
}

/**
 * Generate mock sprint history events
 */
function generateSprintHistory(sprintId: string): SprintHistoryEvent[] {
  const historyMap: Record<string, SprintHistoryEvent[]> = {
    'sprint-1': [
      {
        id: 'event-1',
        sprintId: 'sprint-1',
        eventType: 'created',
        newStatus: 'planning',
        timestamp: '2026-02-01T08:00:00Z',
        description: 'Sprint created',
      },
      {
        id: 'event-2',
        sprintId: 'sprint-1',
        eventType: 'started',
        previousStatus: 'planning',
        newStatus: 'active',
        timestamp: '2026-02-01T10:00:00Z',
        description: 'Sprint started',
      },
      {
        id: 'event-3',
        sprintId: 'sprint-1',
        eventType: 'completed',
        previousStatus: 'active',
        newStatus: 'completed',
        timestamp: '2026-02-14T18:00:00Z',
        description: 'All tasks completed',
      },
      {
        id: 'event-4',
        sprintId: 'sprint-1',
        eventType: 'archived',
        previousStatus: 'completed',
        newStatus: 'archived',
        timestamp: '2026-02-20T12:30:00Z',
        description: 'Sprint archived for historical reference',
      },
    ],
    'sprint-2': [
      {
        id: 'event-5',
        sprintId: 'sprint-2',
        eventType: 'created',
        newStatus: 'planning',
        timestamp: '2026-02-15T08:00:00Z',
        description: 'Sprint created',
      },
      {
        id: 'event-6',
        sprintId: 'sprint-2',
        eventType: 'started',
        previousStatus: 'planning',
        newStatus: 'active',
        timestamp: '2026-02-15T10:00:00Z',
        description: 'Sprint started',
      },
    ],
    'sprint-3': [
      {
        id: 'event-7',
        sprintId: 'sprint-3',
        eventType: 'created',
        newStatus: 'planning',
        timestamp: '2026-02-28T08:00:00Z',
        description: 'Sprint created',
      },
    ],
  }

  return historyMap[sprintId] || []
}

/**
 * Generate mock tasks for a sprint
 */
function generateSprintTasks(sprintId: string): SprintTask[] {
  const taskMap: Record<string, SprintTask[]> = {
    'sprint-1': [
      {
        id: 'task-1',
        title: 'Set up authentication system',
        status: 'done',
        assignee: 'alice',
        priority: 'high',
        sprintId: 'sprint-1',
      },
      {
        id: 'task-2',
        title: 'Create user registration form',
        status: 'done',
        assignee: 'bob',
        priority: 'high',
        sprintId: 'sprint-1',
      },
      {
        id: 'task-3',
        title: 'Implement password reset',
        status: 'done',
        assignee: 'carol',
        priority: 'medium',
        sprintId: 'sprint-1',
      },
      {
        id: 'task-4',
        title: 'Add session management',
        status: 'done',
        assignee: 'david',
        priority: 'high',
        sprintId: 'sprint-1',
      },
      {
        id: 'task-5',
        title: 'Write auth tests',
        status: 'done',
        assignee: 'eve',
        priority: 'medium',
        sprintId: 'sprint-1',
      },
    ],
    'sprint-2': [
      {
        id: 'task-6',
        title: 'Design API endpoints',
        status: 'done',
        assignee: 'alice',
        priority: 'high',
        sprintId: 'sprint-2',
      },
      {
        id: 'task-7',
        title: 'Implement user endpoints',
        status: 'done',
        assignee: 'bob',
        priority: 'high',
        sprintId: 'sprint-2',
      },
      {
        id: 'task-8',
        title: 'Implement project endpoints',
        status: 'in-progress',
        assignee: 'carol',
        priority: 'high',
        sprintId: 'sprint-2',
      },
      {
        id: 'task-9',
        title: 'Add request validation',
        status: 'in-progress',
        assignee: 'david',
        priority: 'medium',
        sprintId: 'sprint-2',
      },
      {
        id: 'task-10',
        title: 'Implement error handling',
        status: 'backlog',
        assignee: 'eve',
        priority: 'high',
        sprintId: 'sprint-2',
      },
      {
        id: 'task-11',
        title: 'Write API documentation',
        status: 'backlog',
        assignee: 'alice',
        priority: 'medium',
        sprintId: 'sprint-2',
      },
    ],
    'sprint-3': [
      {
        id: 'task-12',
        title: 'Redesign dashboard layout',
        status: 'backlog',
        assignee: 'frank',
        priority: 'high',
        sprintId: 'sprint-3',
      },
      {
        id: 'task-13',
        title: 'Implement dark mode',
        status: 'backlog',
        assignee: 'grace',
        priority: 'low',
        sprintId: 'sprint-3',
      },
      {
        id: 'task-14',
        title: 'Optimize database queries',
        status: 'backlog',
        assignee: 'henry',
        priority: 'high',
        sprintId: 'sprint-3',
      },
    ],
  }

  return taskMap[sprintId] || []
}

/**
 * Generate burndown data for a sprint
 */
function generateBurndownData(sprintId: string): BurndownDataPoint[] {
  const sprintStartDates: Record<string, Date> = {
    'sprint-1': new Date('2026-02-01'),
    'sprint-2': new Date('2026-02-15'),
    'sprint-3': new Date('2026-03-01'),
  }

  const sprintDuration = 14 // 2 weeks
  const startDate = sprintStartDates[sprintId] || new Date()

  const dataPoints: BurndownDataPoint[] = []
  let actualPoints = 34 // Starting points varies by sprint

  for (let day = 0; day <= Math.min(sprintDuration, 5); day++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(currentDate.getDate() + day)

    // Ideal burndown (linear)
    const idealPoints = 34 - (34 / sprintDuration) * day

    // Actual burndown with realistic variation
    if (day > 0) {
      actualPoints = Math.max(0, actualPoints - Math.random() * 6 - 2)
    }

    dataPoints.push({
      day,
      ideal: Math.round(idealPoints),
      actual: Math.round(actualPoints),
      date: currentDate.toISOString().split('T')[0],
    })
  }

  return dataPoints
}

/**
 * Generate team capacity data for a sprint
 */
function generateTeamCapacity(sprintId: string): TeamCapacity {
  const members: TeamMemberCapacity[] = [
    {
      id: 'alice',
      name: 'Alice Johnson',
      role: 'Senior Developer',
      allocatedPoints: 13,
      maxCapacity: 20,
      utilizationRate: 65,
      availability: 'available',
    },
    {
      id: 'bob',
      name: 'Bob Smith',
      role: 'Developer',
      allocatedPoints: 11,
      maxCapacity: 20,
      utilizationRate: 55,
      availability: 'available',
    },
    {
      id: 'carol',
      name: 'Carol Davis',
      role: 'Developer',
      allocatedPoints: 8,
      maxCapacity: 15,
      utilizationRate: 53,
      availability: 'busy',
    },
    {
      id: 'david',
      name: 'David Wilson',
      role: 'QA Engineer',
      allocatedPoints: 6,
      maxCapacity: 15,
      utilizationRate: 40,
      availability: 'available',
    },
    {
      id: 'eve',
      name: 'Eve Martinez',
      role: 'Developer',
      allocatedPoints: 7,
      maxCapacity: 18,
      utilizationRate: 39,
      availability: 'unavailable',
    },
  ]

  const totalCapacity = members.reduce((sum, m) => sum + m.maxCapacity, 0)
  const allocatedCapacity = members.reduce((sum, m) => sum + m.allocatedPoints, 0)

  return {
    sprintId,
    members,
    totalCapacity,
    allocatedCapacity,
    availableCapacity: totalCapacity - allocatedCapacity,
  }
}

/**
 * Check team capacity for sprint planning
 */
function checkTeamCapacity(agentIds: string[], estimatedPoints: number) {
  const maxCapacityPerAgent = 10
  const maxAgentLoad = 85 // Warn at 85% utilization

  // Simulate agent loads
  const agentLoads: Record<string, number> = {
    alice: 65,
    bob: 55,
    carol: 53,
    david: 40,
    eve: 39,
  }

  let totalAvailableCapacity = 0
  let overCapacityAgents = 0

  agentIds.forEach((agentId) => {
    const currentLoad = agentLoads[agentId] || 0
    const available = Math.max(0, maxCapacityPerAgent - (currentLoad / 100) * maxCapacityPerAgent)
    totalAvailableCapacity += available

    if (currentLoad > maxAgentLoad) {
      overCapacityAgents += 1
    }
  })

  const totalRequired = estimatedPoints
  const canAssign = totalAvailableCapacity >= totalRequired
  const avgUtilization = (agentIds.reduce((sum, id) => sum + (agentLoads[id] || 0), 0) / agentIds.length)

  return {
    isValid: canAssign && overCapacityAgents === 0,
    message: !canAssign
      ? `Insufficient capacity. Required: ${totalRequired}, Available: ${totalAvailableCapacity.toFixed(1)}`
      : overCapacityAgents > 0
        ? `${overCapacityAgents} agent(s) are near maximum capacity`
        : undefined,
    utilizationRate: avgUtilization,
  }
}

/**
 * MSW handlers for sprint endpoints
 */
export const sprintHandlers = [
  /**
   * GET /api/sprints
   * Returns paginated sprint list with optional filtering
   */
  http.get('/api/sprints', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const status = url.searchParams.get('status')

    let sprints = generateSprints()

    // Filter by status if provided
    if (status) {
      sprints = sprints.filter((s) => s.status === status)
    }

    const total = sprints.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const paginatedSprints = sprints.slice(startIndex, startIndex + pageSize)

    return HttpResponse.json<SprintsListResponse>(
      {
        data: paginatedSprints,
        total,
        page,
        pageSize,
        totalPages,
      },
      { status: 200 }
    )
  }),

  /**
   * GET /api/sprints/:id
   * Returns sprint details with tasks
   */
  http.get('/api/sprints/:id', ({ params }) => {
    const { id } = params
    const sprints = generateSprints()
    const sprint = sprints.find((s) => s.id === id)

    if (!sprint) {
      return HttpResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(sprint, {
      headers: {
        'X-Resource-Version': String(sprint.version),
      },
      status: 200,
    })
  }),

  /**
   * GET /api/sprints/:id/tasks
   * Returns tasks for a specific sprint
   */
  http.get('/api/sprints/:id/tasks', ({ params }) => {
    const { id } = params
    const tasks = generateSprintTasks(id as string)

    return HttpResponse.json<SprintTask[]>(tasks, { status: 200 })
  }),

  /**
   * GET /api/sprints/:id/burndown
   * Returns burndown data for burndown chart
   */
  http.get('/api/sprints/:id/burndown', ({ params }) => {
    const { id } = params
    const burndownData = generateBurndownData(id as string)

    return HttpResponse.json<BurndownDataPoint[]>(burndownData, { status: 200 })
  }),

  /**
   * GET /api/sprints/:id/capacity
   * Returns team capacity allocation for the sprint
   */
  http.get('/api/sprints/:id/capacity', ({ params }) => {
    const { id } = params
    const capacity = generateTeamCapacity(id as string)

    return HttpResponse.json<TeamCapacity>(capacity, { status: 200 })
  }),

  /**
   * POST /api/sprints
   * Creates a new sprint
   */
  http.post('/api/sprints', async ({ request }) => {
    try {
      const body = await request.json() as {
        name: string
        startDate: string
        endDate: string
        teamAssignment: string
      }

      // Validate required fields
      if (!body.name || !body.startDate || !body.endDate || !body.teamAssignment) {
        return HttpResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }

      // Validate date range
      const startDate = new Date(body.startDate)
      const endDate = new Date(body.endDate)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return HttpResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        )
      }

      if (endDate <= startDate) {
        return HttpResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        )
      }

      // Create new sprint
      const newSprint: Sprint = {
        id: `sprint-${Date.now()}`,
        name: body.name,
        status: 'planning',
        goals: '',
        tasks: [],
        estimatedPoints: 0,
        taskCount: 0,
        completedCount: 0,
        createdAt: new Date().toISOString(),
        startDate: body.startDate,
        endDate: body.endDate,
      }

      return HttpResponse.json(newSprint, { status: 201 })
    } catch (error) {
      return HttpResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
  }),

  /**
   * PATCH /api/sprints/:id
   * Updates an existing sprint
   */
  http.patch('/api/sprints/:id', async ({ params, request }) => {
    try {
      const { id } = params
      const body = await request.json() as Partial<{
        name: string
        startDate: string
        endDate: string
        teamAssignment: string
        status: string
        version?: number
      }>

      const sprints = generateSprints()
      const sprint = sprints.find((s) => s.id === id)

      if (!sprint) {
        return HttpResponse.json(
          { error: 'Sprint not found' },
          { status: 404 }
        )
      }

      // Check version if provided (conflict detection)
      if (body.version !== undefined) {
        const serverVersion = sprintVersionStore[id as keyof typeof sprintVersionStore] || 1

        // Simulate ~5% conflict rate when version mismatches
        if (body.version !== serverVersion && Math.random() < 0.05) {
          return HttpResponse.json(
            {
              error: 'conflict',
              serverVersion: {
                ...sprint,
                version: serverVersion,
              },
            },
            { status: 409 }
          )
        }

        // Check actual version match
        if (body.version !== serverVersion) {
          return HttpResponse.json(
            {
              error: 'conflict',
              serverVersion: {
                ...sprint,
                version: serverVersion,
              },
            },
            { status: 409 }
          )
        }
      }

      // Prevent editing dates for closed sprints
      if (sprint.status === 'completed') {
        if (
          (body.startDate && body.startDate !== sprint.startDate) ||
          (body.endDate && body.endDate !== sprint.endDate)
        ) {
          return HttpResponse.json(
            { error: 'Cannot edit dates for closed sprints' },
            { status: 400 }
          )
        }
      }

      // Validate date range if provided
      if (body.startDate || body.endDate) {
        const startDate = new Date(body.startDate || sprint.startDate || '')
        const endDate = new Date(body.endDate || sprint.endDate || '')

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return HttpResponse.json(
            { error: 'Invalid date format' },
            { status: 400 }
          )
        }

        if (endDate <= startDate) {
          return HttpResponse.json(
            { error: 'End date must be after start date' },
            { status: 400 }
          )
        }
      }

      // Update sprint with incremented version
      const updatedSprint: Sprint = {
        ...sprint,
        name: body.name !== undefined ? body.name : sprint.name,
        startDate: body.startDate || sprint.startDate,
        endDate: body.endDate || sprint.endDate,
        status: body.status as any || sprint.status,
        version: (sprint.version || 1) + 1,
      }

      // Increment version in store
      sprintVersionStore[id as keyof typeof sprintVersionStore] = updatedSprint.version

      return HttpResponse.json(updatedSprint, {
        headers: {
          'X-Resource-Version': String(updatedSprint.version),
        },
        status: 200,
      })
    } catch (error) {
      return HttpResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
  }),

  /**
   * POST /api/sprints/capacity/check
   * Validates team capacity for sprint planning
   */
  http.post('/api/sprints/capacity/check', async ({ request }) => {
    try {
      const body = await request.json() as {
        agentIds: string[]
        estimatedPoints: number
      }

      if (!body.agentIds || !Array.isArray(body.agentIds)) {
        return HttpResponse.json(
          { error: 'Invalid agent IDs' },
          { status: 400 }
        )
      }

      if (typeof body.estimatedPoints !== 'number' || body.estimatedPoints < 0) {
        return HttpResponse.json(
          { error: 'Invalid estimated points' },
          { status: 400 }
        )
      }

      const capacityCheck = checkTeamCapacity(body.agentIds, body.estimatedPoints)

      return HttpResponse.json(capacityCheck, { status: 200 })
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to check capacity' },
        { status: 500 }
      )
    }
  }),

  /**
   * GET /api/agents/:id/capacity
   * Returns agent capacity information
   */
  http.get('/api/agents/:id/capacity', ({ params }) => {
    const { id } = params

    // Mock agent capacity data
    const agentCapacity: Record<string, { currentLoad: number; maxCapacity: number }> = {
      alice: { currentLoad: 6.5, maxCapacity: 10 },
      bob: { currentLoad: 5.5, maxCapacity: 10 },
      carol: { currentLoad: 5.3, maxCapacity: 10 },
      david: { currentLoad: 4.0, maxCapacity: 10 },
      eve: { currentLoad: 3.9, maxCapacity: 10 },
    }

    const capacity = agentCapacity[id as string]

    if (!capacity) {
      return HttpResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(capacity, { status: 200 })
  }),

  /**
   * GET /api/sprints/:id/history
   * Returns sprint lifecycle history events
   */
  http.get('/api/sprints/:id/history', ({ params }) => {
    const { id } = params
    const history = generateSprintHistory(id as string)

    return HttpResponse.json<SprintHistoryEvent[]>(history, { status: 200 })
  }),

  /**
   * GET /api/sprints/:id/report
   * Returns sprint performance report with historical metrics and trends
   */
  http.get('/api/sprints/:id/report', ({ params, request }) => {
    const { id } = params
    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    const sprints = generateSprints()
    const sprint = sprints.find((s) => s.id === id)

    if (!sprint) {
      return HttpResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      )
    }

    // Parse dates for filtering
    const reportStartDate = startDate ? new Date(startDate) : new Date(sprint.startDate || '')
    const reportEndDate = endDate ? new Date(endDate) : new Date(sprint.endDate || '')

    // Generate historical data points
    const dataPoints = []
    const currentDate = new Date(reportStartDate)
    const daysDiff = Math.ceil((reportEndDate.getTime() - reportStartDate.getTime()) / (1000 * 60 * 60 * 24))

    // Generate realistic trends
    let velocity = 8
    let completionRate = 10
    let tasksCompleted = 0
    let capacityUtilization = 45

    for (let day = 0; day <= daysDiff; day++) {
      // Simulate velocity variations
      velocity = Math.max(5, Math.min(15, velocity + (Math.random() - 0.5) * 3))

      // Completion rate increases over time
      completionRate = Math.min(100, completionRate + Math.random() * 8)

      // Tasks completed accumulates
      tasksCompleted = Math.floor((completionRate / 100) * sprint.taskCount)

      // Capacity utilization grows initially then stabilizes
      capacityUtilization = Math.max(40, Math.min(90, capacityUtilization + (Math.random() - 0.3) * 5))

      dataPoints.push({
        date: currentDate.toISOString().split('T')[0],
        velocity: Math.round(velocity * 10) / 10,
        completionRate: Math.round(completionRate),
        tasksCompleted,
        tasksInProgress: Math.max(0, sprint.taskCount - tasksCompleted - Math.floor(sprint.taskCount * 0.2)),
        capacityUtilization: Math.round(capacityUtilization),
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Calculate summary metrics
    const averageVelocity = dataPoints.length > 0
      ? Math.round((dataPoints.reduce((sum, p) => sum + p.velocity, 0) / dataPoints.length) * 10) / 10
      : 0

    const averageCompletionRate = dataPoints.length > 0
      ? Math.round(dataPoints.reduce((sum, p) => sum + p.completionRate, 0) / dataPoints.length)
      : 0

    const totalTasksCompleted = dataPoints[dataPoints.length - 1]?.tasksCompleted || 0

    const capacityUtilizationValues = dataPoints.map((p) => p.capacityUtilization)
    const peakCapacityUtilization = Math.max(...capacityUtilizationValues, 0)
    const lowCapacityUtilization = Math.min(...capacityUtilizationValues, 100)

    const report: SprintReport = {
      sprintId: sprint.id,
      sprintName: sprint.name,
      startDate: sprint.startDate || reportStartDate.toISOString().split('T')[0],
      endDate: sprint.endDate || reportEndDate.toISOString().split('T')[0],
      dataPoints,
      summary: {
        averageVelocity,
        averageCompletionRate,
        totalTasksCompleted,
        peakCapacityUtilization,
        lowCapacityUtilization,
      },
    }

    return HttpResponse.json<SprintReport>(report, { status: 200 })
  }),

  /**
   * POST /api/sprints/:id/transition
   * Transitions a sprint to a new state with validation
   * - Validates state machine transitions
   * - Prevents completing sprint with incomplete tasks (hard block)
   * - Returns error with task count for blocked transitions
   */
  http.post('/api/sprints/:id/transition', async ({ params, request }) => {
    try {
      const { id } = params
      const body = await request.json() as { newState: string }

      // Get current sprint state
      const sprints = generateSprints()
      const sprint = sprints.find((s) => s.id === id)

      if (!sprint) {
        return HttpResponse.json(
          { error: 'Sprint not found' },
          { status: 404 }
        )
      }

      const { newState } = body

      // Validate state transition
      const validTransitions: Record<string, string[]> = {
        planning: ['active'],
        active: ['in-review'],
        'in-review': ['completed'],
        completed: [],
        archived: [],
      }

      if (!validTransitions[sprint.status]?.includes(newState)) {
        return HttpResponse.json(
          {
            error: {
              code: 'INVALID_TRANSITION',
              message: `Cannot transition from ${sprint.status} to ${newState}`,
            },
          },
          { status: 422 }
        )
      }

      // Hard block: cannot complete with incomplete tasks
      if (newState === 'completed') {
        const incompleteTasks = sprint.taskCount - sprint.completedCount

        if (incompleteTasks > 0) {
          return HttpResponse.json(
            {
              error: {
                code: 'INCOMPLETE_TASKS',
                message: `Cannot complete sprint with ${incompleteTasks} incomplete task${incompleteTasks === 1 ? '' : 's'}`,
                count: incompleteTasks,
              },
            },
            { status: 422 }
          )
        }
      }

      // Perform transition
      const transitionedSprint: Sprint = {
        ...sprint,
        status: newState as any,
        version: (sprint.version || 1) + 1,
      }

      // Update version store
      sprintVersionStore[id] = transitionedSprint.version

      return HttpResponse.json(
        { success: true, sprint: transitionedSprint },
        { status: 200 }
      )
    } catch (error) {
      return HttpResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
  }),
]
