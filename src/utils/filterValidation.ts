import type { TaskStatus, TaskPriority } from '../types/task'

export const TASK_STATUSES: TaskStatus[] = [
  'backlog',
  'in-progress',
  'in-review',
  'done',
]

export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']

export function isValidStatus(value: unknown): value is TaskStatus {
  return value !== null && value !== undefined && TASK_STATUSES.includes(value as TaskStatus)
}

export function isValidPriority(value: unknown): value is TaskPriority {
  return value !== null && value !== undefined && TASK_PRIORITIES.includes(value as TaskPriority)
}

export function validateAndCleanFilters(filters: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {}
  const warnings: string[] = []

  const status = filters.status
  if (status !== undefined && status !== null) {
    if (isValidStatus(status)) {
      cleaned.status = status
    } else {
      warnings.push(`Invalid status value: ${status}. Ignoring.`)
    }
  }

  const priority = filters.priority
  if (priority !== undefined && priority !== null) {
    if (isValidPriority(priority)) {
      cleaned.priority = priority
    } else {
      warnings.push(`Invalid priority value: ${priority}. Ignoring.`)
    }
  }

  const search = filters.search
  if (search && typeof search === 'string') {
    cleaned.search = search
  }

  const team = filters.team
  if (team && typeof team === 'string') {
    cleaned.team = team
  }

  const sprint = filters.sprint
  if (sprint && typeof sprint === 'string') {
    cleaned.sprint = sprint
  }

  const assignee = filters.assignee
  if (assignee && typeof assignee === 'string') {
    cleaned.assignee = assignee
  }

  if (warnings.length > 0) {
    console.warn('Invalid filter parameters:', warnings.join(' '))
  }

  return cleaned
}
