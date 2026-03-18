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
  version: number
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
  version?: number
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

/**
 * Filter parameters for infinite scroll task list
 * All parameters are optional and combined with AND logic across dimensions, OR within dimensions
 */
export interface TaskListFilters {
  priority?: TaskPriority | TaskPriority[] | null
  status?: TaskStatus | TaskStatus[] | null
  agent?: string | string[] | null
  sprint?: string | string[] | null
  assignee?: string | string[] | null
  dateRangeStart?: string | null
  dateRangeEnd?: string | null
}

/**
 * Response format for infinite scroll pagination with cursor support
 */
export interface PaginatedTasksResponse {
  data: Task[]
  totalCount: number
  nextCursor?: number | null
  hasNextPage: boolean
  pageSize: number
}
