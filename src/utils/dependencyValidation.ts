import type { Task } from '../types/task'

export interface DependencyValidationError {
  type: 'invalid-id' | 'circular-dependency'
  message: string
  invalidIds?: string[]
}

/**
 * Validates that all task IDs exist
 */
export function validateTaskIds(
  taskIds: string[],
  allTasks: Task[]
): DependencyValidationError | null {
  const invalidIds = taskIds.filter(
    (id) => !allTasks.some((task) => task.id === id)
  )

  if (invalidIds.length > 0) {
    return {
      type: 'invalid-id',
      message: `Invalid task ID(s): ${invalidIds.join(', ')}`,
      invalidIds,
    }
  }

  return null
}

/**
 * Checks for direct circular dependencies (A depends on B, B depends on A)
 */
export function checkDirectCircularDependencies(
  taskId: string,
  dependsOn: string[],
  allTasks: Task[]
): DependencyValidationError | null {
  for (const depId of dependsOn) {
    const depTask = allTasks.find((t) => t.id === depId)
    if (
      depTask?.dependsOn &&
      depTask.dependsOn.includes(taskId)
    ) {
      return {
        type: 'circular-dependency',
        message: `Circular dependency detected: ${taskId} depends on ${depId}, but ${depId} depends on ${taskId}`,
      }
    }
  }

  return null
}

/**
 * Detects circular dependencies in a task dependency graph using BFS
 *
 * This is a comprehensive check that detects all circular dependencies,
 * not just direct two-way dependencies.
 *
 * @param taskId - The task to add a dependency to
 * @param dependsOnTaskId - The task that the first task will depend on
 * @param allTasks - Map of all tasks in the system (task ID -> Task)
 * @returns Error message if circular dependency detected, null otherwise
 *
 * @example
 * ```tsx
 * const allTasksMap = new Map(allTasks.map(t => [t.id, t]))
 * const error = detectCircularDependency('task-1', 'task-2', allTasksMap)
 * if (error) {
 *   showError(error)
 * }
 * ```
 */
export function detectCircularDependency(
  taskId: string,
  dependsOnTaskId: string,
  allTasks: Map<string, Task>
): string | null {
  // Direct self-dependency check
  if (taskId === dependsOnTaskId) {
    return 'A task cannot depend on itself'
  }

  // BFS to detect cycles
  const visited = new Set<string>()
  const queue = [dependsOnTaskId]

  while (queue.length > 0) {
    const currentId = queue.shift()!

    if (currentId === taskId) {
      return `Adding this dependency would create a circular dependency: ${taskId} → ${dependsOnTaskId} → ... → ${taskId}`
    }

    if (visited.has(currentId)) {
      continue
    }

    visited.add(currentId)

    const task = allTasks.get(currentId)
    if (task?.dependsOn) {
      for (const depId of task.dependsOn) {
        if (!visited.has(depId)) {
          queue.push(depId)
        }
      }
    }
  }

  return null
}

/**
 * Validates dependencies for a task
 */
export function validateDependencies(
  taskId: string,
  dependsOn: string[],
  allTasks: Task[]
): DependencyValidationError | null {
  // Check if task IDs are valid
  const idError = validateTaskIds(dependsOn, allTasks)
  if (idError) return idError

  // Check for direct circular dependencies
  const circularError = checkDirectCircularDependencies(taskId, dependsOn, allTasks)
  if (circularError) return circularError

  return null
}
