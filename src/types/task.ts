export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  name: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface TaskFormData {
  name: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  tags: string[]
}
