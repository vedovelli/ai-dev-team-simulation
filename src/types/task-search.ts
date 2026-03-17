/**
 * Types for task search and advanced filtering
 *
 * Supports full-text search, faceted filtering, debounced input, and pagination.
 */

import type { TaskStatus, TaskPriority } from './task'

export interface SearchTask {
  id: string
  title: string
  description: string
  assignee: string
  status: TaskStatus
  priority: TaskPriority
  sprint: string
  deadline?: string
  matchedFields: ('title' | 'description')[]
}

export interface SearchFacets {
  priority: Record<TaskPriority, number>
  status: Record<TaskStatus, number>
  assignedAgent: Record<string, number>
  sprint: Record<string, number>
}

export interface TaskSearchPagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface TaskSearchResponse {
  results: SearchTask[]
  facets: SearchFacets
  pagination: TaskSearchPagination
}

export interface TaskSearchFilters {
  priority?: string
  status?: string
  assignedAgent?: string
  sprint?: string
  deadlineFrom?: string
  deadlineTo?: string
}

export interface UseTaskSearchReturn {
  results: SearchTask[]
  facets: SearchFacets
  pagination: TaskSearchPagination
  isLoading: boolean
  isError: boolean
  error: Error | null
  hasSearchQuery: boolean
  debouncedQuery: string
  setQuery: (query: string) => void
  setFilters: (filters: TaskSearchFilters) => void
  setPage: (page: number) => void
}

export interface UseTaskSearchOptions {
  debounceMs?: number
  perPage?: number
  staleTime?: number
}
