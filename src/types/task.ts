export type TaskStatus = 'backlog' | 'in-progress' | 'in-review' | 'done'

export interface Task {
  id: string
  title: string
  assignee: string
  status: TaskStatus
  storyPoints: number
  sprint: string
  createdAt: string
  updatedAt: string
}

export interface UpdateTaskInput {
  title?: string
  assignee?: string
  status?: TaskStatus
  storyPoints?: number
}
