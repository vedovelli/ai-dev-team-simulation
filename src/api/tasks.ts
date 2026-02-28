import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateTaskInput, PaginatedResponse, Task, TaskFilters, TaskSorting, UpdateTaskInput } from '../types/task'

const API_BASE = '/api'

interface FetchTasksParams {
  page?: number
  limit?: number
  filters?: TaskFilters
  sorting?: TaskSorting
}

async function fetchTasks({
  page = 1,
  limit = 10,
  filters,
  sorting,
}: FetchTasksParams): Promise<PaginatedResponse<Task>> {
  const searchParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  if (filters?.status) searchParams.append('status', filters.status)
  if (filters?.priority) searchParams.append('priority', filters.priority)
  if (filters?.assignee) searchParams.append('assignee', filters.assignee)

  if (sorting) {
    searchParams.append('sortField', sorting.field)
    searchParams.append('sortDirection', sorting.direction)
  }

  const response = await fetch(`${API_BASE}/tasks?${searchParams.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch tasks')
  }

  return response.json()
}

async function fetchTask(id: string): Promise<Task> {
  const response = await fetch(`${API_BASE}/tasks/${id}`)

  if (!response.ok) {
    throw new Error('Failed to fetch task')
  }

  return response.json()
}

async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create task')
  }

  return response.json()
}

async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update task')
  }

  return response.json()
}

async function validateTaskName(name: string): Promise<boolean> {
  const searchParams = new URLSearchParams({ name })
  const response = await fetch(`${API_BASE}/tasks/validate-name?${searchParams.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to validate task name')
  }

  const result = await response.json()
  return result.isValid
}

export function useTasksQuery(
  page: number = 1,
  limit: number = 10,
  filters?: TaskFilters,
  sorting?: TaskSorting
) {
  return useQuery({
    queryKey: ['tasks', page, limit, filters, sorting],
    queryFn: () => fetchTasks({ page, limit, filters, sorting }),
  })
}

export function useTaskQuery(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => fetchTask(id),
    enabled: !!id,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) => updateTask(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useValidateTaskName() {
  return useMutation({
    mutationFn: validateTaskName,
  })
}
