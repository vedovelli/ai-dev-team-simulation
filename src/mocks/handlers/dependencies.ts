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
 * MSW handlers for task dependency endpoints
 * - GET /api/tasks/:id/dependencies - Fetch task dependencies and blockers
 * - POST /api/tasks/:id/dependencies - Add a new dependency
 * - DELETE /api/tasks/:id/dependencies/:depId - Remove a dependency
 */
export const dependencyHandlers = [
  // Get task dependencies and blockers
  http.get('/api/tasks/:id/dependencies', ({ params }) => {
    const { id } = params

    const task = tasksMap.get(id as string)
    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const dependencies = getDependencies(id as string)
    const blockers = getBlockers(id as string)

    return HttpResponse.json({
      taskId: id,
      dependencies,
      blockers,
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
]
