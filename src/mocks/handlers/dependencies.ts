import { http, HttpResponse } from 'msw'
import type { Task } from '../../types/task'
import { detectCircularDependency } from '../../utils/dependencyValidation'

/**
 * In-memory storage for task dependencies
 * Maps taskId -> array of dependsOnTaskIds
 */
const dependenciesStore = new Map<string, string[]>()

/**
 * Generate mock tasks with realistic dependency chains
 * Creates linear dependency chains (A -> B -> C) for variety
 */
function generateMockTasksWithDependencies(): Map<string, Task> {
  const tasks = new Map<string, Task>()

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Setup database schema',
      assignee: 'alice',
      team: 'backend',
      status: 'done',
      priority: 'high',
      storyPoints: 3,
      sprint: 'sprint-1',
      order: 1,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      dependsOn: [],
      blockedBy: [],
    },
    {
      id: 'task-2',
      title: 'Create API endpoints',
      assignee: 'bob',
      team: 'backend',
      status: 'in-progress',
      priority: 'high',
      storyPoints: 5,
      sprint: 'sprint-1',
      order: 2,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      dependsOn: ['task-1'],
      blockedBy: [],
    },
    {
      id: 'task-3',
      title: 'Frontend integration',
      assignee: 'charlie',
      team: 'frontend',
      status: 'backlog',
      priority: 'high',
      storyPoints: 8,
      sprint: 'sprint-1',
      order: 3,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      dependsOn: ['task-2'],
      blockedBy: [],
    },
    {
      id: 'task-4',
      title: 'Write unit tests',
      assignee: 'diana',
      team: 'qa',
      status: 'backlog',
      priority: 'medium',
      storyPoints: 5,
      sprint: 'sprint-1',
      order: 4,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      dependsOn: ['task-3'],
      blockedBy: [],
    },
    {
      id: 'task-5',
      title: 'Documentation',
      assignee: 'eve',
      team: 'docs',
      status: 'backlog',
      priority: 'low',
      storyPoints: 3,
      sprint: 'sprint-2',
      order: 5,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      dependsOn: ['task-4'],
      blockedBy: [],
    },
  ]

  // Initialize tasks in map
  mockTasks.forEach((task) => {
    tasks.set(task.id, task)
    if (task.dependsOn && task.dependsOn.length > 0) {
      dependenciesStore.set(task.id, task.dependsOn)
    }
  })

  return tasks
}

// Initialize mock data
const tasksMap = generateMockTasksWithDependencies()

/**
 * Get all tasks that a given task depends on
 */
function getDependencies(taskId: string): Task[] {
  const depIds = dependenciesStore.get(taskId) || []
  return depIds.map((id) => tasksMap.get(id)!).filter(Boolean)
}

/**
 * Get all tasks that depend on the given task (blockers)
 */
function getBlockers(taskId: string): Task[] {
  const blockers: Task[] = []
  for (const [id, depIds] of dependenciesStore.entries()) {
    if (depIds.includes(taskId)) {
      const task = tasksMap.get(id)
      if (task) blockers.push(task)
    }
  }
  return blockers
}

/**
 * Compute transitive blocking: return all tasks that are blocked
 * (directly or indirectly) by the given task being incomplete
 */
function getTransitiveBlockedTasks(taskId: string): string[] {
  const blocked = new Set<string>()
  const queue = [taskId]

  while (queue.length > 0) {
    const current = queue.shift()!
    const blockedByThis = Array.from(dependenciesStore.entries()).filter(
      ([_, deps]) => deps.includes(current)
    )

    for (const [id] of blockedByThis) {
      const task = tasksMap.get(id)
      // Only add to blocked set if the blocker task is not done
      if (task && task.status !== 'done' && !blocked.has(id)) {
        blocked.add(id)
        queue.push(id)
      }
    }
  }

  return Array.from(blocked)
}

/**
 * Check if a task is blocked (directly or transitively)
 */
function isTaskBlocked(taskId: string): boolean {
  const deps = dependenciesStore.get(taskId) || []

  // Check direct dependencies
  for (const depId of deps) {
    const depTask = tasksMap.get(depId)
    if (depTask && depTask.status !== 'done') {
      return true
    }
  }

  // Check transitive blocking (if any dependency blocks others and those blockers are incomplete)
  for (const depId of deps) {
    const depTask = tasksMap.get(depId)
    if (depTask && depTask.status !== 'done') {
      // This dependency blocks us
      return true
    }
  }

  return false
}

/**
 * MSW handlers for task dependency endpoints
 * - GET /api/tasks/:id/dependencies - Fetch task dependencies and blockers
 * - POST /api/tasks/:id/dependencies - Add a new dependency
 * - DELETE /api/tasks/:id/dependencies/:depId - Remove a dependency
 */
export const dependencyHandlers = [
  // Get task dependencies and blockers with blocking status
  http.get('/api/tasks/:id/dependencies', ({ params }) => {
    const { id } = params as { id: string }

    const task = tasksMap.get(id)
    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const dependencies = getDependencies(id)
    const blockers = getBlockers(id)
    const isBlocked = isTaskBlocked(id)
    const transitivelyBlockedTasks = getTransitiveBlockedTasks(id)

    return HttpResponse.json({
      taskId: id,
      dependencies,
      blockers,
      isBlocked,
      blockingStatus: {
        isBlocked,
        blockedDependencies: dependencies.map((d) => ({
          id: d.id,
          title: d.title,
          status: d.status,
        })),
        transitivelyBlockedCount: transitivelyBlockedTasks.length,
      },
    })
  }),

  // Add a new dependency
  http.post('/api/tasks/:id/dependencies', async ({ request, params }) => {
    const { id } = params
    const taskId = id as string

    const task = tasksMap.get(taskId)
    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    try {
      const body = (await request.json()) as {
        dependsOnTaskId: string
      }

      const { dependsOnTaskId } = body

      if (!dependsOnTaskId) {
        return HttpResponse.json(
          { error: 'dependsOnTaskId is required' },
          { status: 400 }
        )
      }

      const depTask = tasksMap.get(dependsOnTaskId)
      if (!depTask) {
        return HttpResponse.json(
          { error: 'Dependency task not found' },
          { status: 404 }
        )
      }

      // Detect circular dependency
      const circularError = detectCircularDependency(taskId, dependsOnTaskId, tasksMap)
      if (circularError) {
        return HttpResponse.json({ error: circularError }, { status: 400 })
      }

      // Add dependency
      const deps = dependenciesStore.get(taskId) || []
      if (!deps.includes(dependsOnTaskId)) {
        deps.push(dependsOnTaskId)
        dependenciesStore.set(taskId, deps)
      }

      // Update task in map
      const updatedTask = {
        ...task,
        dependsOn: [...deps],
        updatedAt: new Date().toISOString(),
      }
      tasksMap.set(taskId, updatedTask)

      return HttpResponse.json(updatedTask)
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to add dependency' },
        { status: 500 }
      )
    }
  }),

  // Remove a dependency
  http.delete('/api/tasks/:id/dependencies/:depId', ({ params }) => {
    const { id, depId } = params
    const taskId = id as string
    const depTaskId = depId as string

    const task = tasksMap.get(taskId)
    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Remove dependency
    const deps = dependenciesStore.get(taskId) || []
    const updatedDeps = deps.filter((id) => id !== depTaskId)
    dependenciesStore.set(taskId, updatedDeps)

    // Update task in map
    const updatedTask = {
      ...task,
      dependsOn: [...updatedDeps],
      updatedAt: new Date().toISOString(),
    }
    tasksMap.set(taskId, updatedTask)

    return HttpResponse.json(updatedTask)
  }),

  // Update blocking relationship status
  http.patch('/api/tasks/:id/blocking-status', async ({ request, params }) => {
    const { id } = params as { id: string }

    const task = tasksMap.get(id)
    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    try {
      const body = (await request.json()) as {
        status?: 'blocked' | 'unblocked'
        action?: 'unblock' | 'block'
      }

      // Validate that blocked tasks cannot be marked complete
      if (isTaskBlocked(id) && task.status === 'done') {
        return HttpResponse.json(
          { error: 'Cannot complete a task that is blocked by incomplete dependencies' },
          { status: 400 }
        )
      }

      // Return current blocking status
      return HttpResponse.json({
        taskId: id,
        isBlocked: isTaskBlocked(id),
        blockedDependencies: getDependencies(id)
          .filter((d) => d.status !== 'done')
          .map((d) => ({ id: d.id, title: d.title })),
        transitivelyBlockedCount: getTransitiveBlockedTasks(id).length,
      })
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to update blocking status' },
        { status: 500 }
      )
    }
  }),
]
