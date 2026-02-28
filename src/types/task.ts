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
  createdAt: string
  updatedAt: string
}

export interface UpdateTaskInput {
  title?: string
  assignee?: string
  team?: string
  status?: TaskStatus
  priority?: TaskPriority
  storyPoints?: number
  order?: number
}
