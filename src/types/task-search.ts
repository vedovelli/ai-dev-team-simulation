/**
 * Types for task search and advanced filtering
 *
 * Supports multi-field filtering, debounced search, and pagination.
 */

import type { Task, TaskStatus, TaskPriority } from './task'

export interface TaskSearchParams {
  q?: string
  status?: TaskStatus[]
  assigneeId?: string
  priority?: TaskPriority
  sprintId?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: keyof Task
  sortDir?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface TaskSearchResult {
  data: Task[]
  meta: {
    total: number
    page: number
    pageSize: number
    pageCount: number
  }
}

export type TaskSearchFilters = Omit<TaskSearchParams, 'page' | 'limit' | 'sortBy' | 'sortDir'>

export interface UseTaskSearchReturn {
  tasks: Task[]
  totalCount: number
  pageCount: number
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  error: Error | null
}
