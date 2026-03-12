export type TaskStatus = 'backlog' | 'in-progress' | 'in-review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  assignee: string
  team: string
  status: TaskStatus
  priority: TaskPriority
  storyPoints: number
  sprint: string
  order: number
  estimatedHours?: number
  createdAt: string
  updatedAt: string
  dependsOn?: string[]
  blockedBy?: string[]
  deadline?: string
}

export interface UpdateTaskInput {
  title?: string
  assignee?: string
  team?: string
  status?: TaskStatus
  priority?: TaskPriority
  storyPoints?: number
  estimatedHours?: number
  order?: number
  dependsOn?: string[]
  description?: string
  deadline?: string
}

export interface TaskHistoryEntry {
  id: string
  taskId: string
  actor: string
  field: string
  previousValue: unknown
  newValue: unknown
  createdAt: string
}

export interface TaskComment {
  id: string
  taskId: string
  author: string
  content: string
  createdAt: string
  updatedAt: string
}
