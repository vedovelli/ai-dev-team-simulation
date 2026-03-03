import type { TaskStatus, TaskPriority } from './task'

export interface CreateTaskInput {
  name: string
  status: TaskStatus
  team: string
  sprint: string
  priority: TaskPriority
  estimatedHours?: number
  assignedAgent?: string | null
}

export interface TaskNameValidationResponse {
  isUnique: boolean
  message?: string
}
