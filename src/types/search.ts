/**
 * Types for global task search with filter persistence
 *
 * Supports full-text search, multi-filter support, pagination, and saved filter sets.
 */

import type { TaskStatus, TaskPriority } from './task'

/**
 * Search filter options for task search
 *
 * All fields are optional. Multiple values are combined with AND logic.
 */
export interface SearchFilters {
  query?: string
  status?: TaskStatus[]
  agentId?: string[]
  sprintId?: string[]
  priority?: TaskPriority[]
  dateRange?: {
    from?: string  // ISO 8601 date
    to?: string    // ISO 8601 date
  }
}

/**
 * Individual task result from search
 */
export interface SearchResult {
  id: string
  title: string
  description: string
  assignee: string
  agentId: string
  status: TaskStatus
  priority: TaskPriority
  sprint: string
  sprintId: string
  deadline?: string
  createdAt: string
}

/**
 * Paginated search response
 */
export interface SearchResponse {
  items: SearchResult[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

/**
 * Named filter set persisted via API
 */
export interface SavedFilter {
  id: string
  name: string
  description?: string
  filters: SearchFilters
  createdAt: string
  updatedAt: string
}

/**
 * Request to save a filter set
 */
export interface SaveFilterRequest {
  name: string
  description?: string
  filters: SearchFilters
}

/**
 * Options for useTaskSearch hook
 */
export interface UseTaskSearchOptions {
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number
  /** Results per page (default: 20) */
  pageSize?: number
  /** Cache stale time in milliseconds (default: 30000 = 30s) */
  staleTime?: number
}

/**
 * Return type for useTaskSearch hook
 */
export interface UseTaskSearchReturn {
  // Query state
  results: SearchResult[]
  isLoading: boolean
  isError: boolean
  error: Error | null

  // Pagination
  page: number
  pageSize: number
  total: number
  totalPages: number

  // Filter state
  filters: SearchFilters
  debouncedQuery: string

  // Actions
  setQuery: (query: string) => void
  setFilters: (filters: SearchFilters) => void
  setPage: (page: number) => void
  reset: () => void
}

/**
 * Options for useSavedFilters hook
 */
export interface UseSavedFiltersOptions {
  /** Enable automatic refetch on window focus (default: true) */
  refetchOnWindowFocus?: boolean
}

/**
 * Return type for useSavedFilters hook
 */
export interface UseSavedFiltersReturn {
  // Query state
  savedFilters: SavedFilter[]
  isLoading: boolean
  isError: boolean
  error: Error | null

  // Mutation states
  isSaving: boolean
  isDeleting: boolean
  isResetting: boolean

  // Actions
  saveFilter: (request: SaveFilterRequest) => Promise<SavedFilter>
  deleteFilter: (id: string) => Promise<void>
  updateFilter: (id: string, request: SaveFilterRequest) => Promise<SavedFilter>
  resetAll: () => Promise<void>
}
