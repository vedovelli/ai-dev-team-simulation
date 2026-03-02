import type { TaskStatus, TaskPriority } from './task'

export interface CreateTaskInput {
  name: string
  status: TaskStatus
  team: string
  sprint: string
  priority: TaskPriority
  estimatedHours?: number
}

export interface TaskNameValidationResponse {
  isUnique: boolean
  message?: string
}
