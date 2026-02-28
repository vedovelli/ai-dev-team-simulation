export interface Task {
  id: string
  name: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  assignee?: string
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTaskInput {
  name: string
  description: string
  status?: 'todo' | 'in_progress' | 'done'
  priority?: 'low' | 'medium' | 'high'
  assignee?: string
  dueDate?: string
}

export interface UpdateTaskInput {
  name?: string
  description?: string
  status?: 'todo' | 'in_progress' | 'done'
  priority?: 'low' | 'medium' | 'high'
  assignee?: string
  dueDate?: string
}

export interface TaskFilters {
  status?: string
  priority?: string
  assignee?: string
}

export interface TaskSorting {
  field: 'name' | 'status' | 'priority' | 'dueDate' | 'createdAt'
  direction: 'asc' | 'desc'
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
