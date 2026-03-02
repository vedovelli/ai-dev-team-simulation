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
