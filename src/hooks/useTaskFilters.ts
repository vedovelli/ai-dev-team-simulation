import { useState, useCallback } from 'react'
import type { TaskStatus, TaskPriority } from '../types/task'

/**
 * Simple component-state task filters
 * All filters are optional and combined with AND logic
 */
export interface TaskFilters {
  agent: string | null
  priority: TaskPriority | null
  status: TaskStatus | null
}

/**
 * Return type for useTaskFilters hook
 */
export interface UseTaskFiltersReturn {
  /** Current filter values */
  filters: TaskFilters
  /** Update a single filter value */
  setFilter: (key: keyof TaskFilters, value: string | null) => void
  /** Clear all filters */
  clearFilters: () => void
  /** Count of active (non-null) filters */
  activeFilterCount: number
}

/**
 * Simple hook for managing task filters in component state
 *
 * Features:
 * - Local state management (no URL persistence)
 * - Filters for: agent, priority, status
 * - AND logic: all non-null filters must match
 * - Simple setFilter and clearFilters methods
 * - Tracks active filter count
 *
 * Usage with useQuery:
 * ```typescript
 * const { filters, setFilter, clearFilters } = useTaskFilters()
 * const { data: tasks } = useQuery({
 *   queryKey: ['tasks', filters],
 *   queryFn: async () => {
 *     const params = new URLSearchParams()
 *     if (filters.agent) params.append('agent', filters.agent)
 *     if (filters.priority) params.append('priority', filters.priority)
 *     if (filters.status) params.append('status', filters.status)
 *     return fetch(`/api/tasks?${params}`).then(r => r.json())
 *   }
 * })
 * ```
 */
export function useTaskFilters(): UseTaskFiltersReturn {
  const [filters, setFilters] = useState<TaskFilters>({
    agent: null,
    priority: null,
    status: null,
  })

  const setFilter = useCallback((key: keyof TaskFilters, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      agent: null,
      priority: null,
      status: null,
    })
  }, [])

  const activeFilterCount = Object.values(filters).filter((v) => v !== null).length

  return {
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
  }
}
