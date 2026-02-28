export type TaskStatus = 'Backlog' | 'In Progress' | 'Review' | 'Done'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  createdAt: string
  updatedAt: string
}

export interface UpdateTaskRequest {
  status: TaskStatus
}
