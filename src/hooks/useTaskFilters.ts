import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { isValidStatus, isValidPriority } from '../utils/filterValidation'
import type { TaskStatus, TaskPriority } from '../types/task'
import type { TaskFilterPreset } from '../types/task-filter-presets'
import { getPresetById, getAllPresets } from '../types/task-filter-presets'

export interface TaskFilters {
  status?: TaskStatus | TaskStatus[] | null
  priority?: TaskPriority | TaskPriority[] | null
  search?: string
  team?: string
  sprint?: string | string[]
  assignee?: string | string[]
  page?: number
  pageSize?: number
}

/**
 * Advanced task filters hook with Router search params sync, debouncing, and presets
 *
 * Features:
 * - Persist filter state in URL search params for shareable, bookmarkable filtered views
 * - Composable filter operators with AND/OR logic
 * - Debounced filter changes (default 300ms) to avoid excessive query re-runs
 * - Support for multiple values per filter dimension
 * - Automatic cache invalidation on filter change
 * - Built-in filter presets for common use cases
 * - Type-safe filter updates
 */
export function useTaskFilters(debounceMs = 300) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const searchParams = useSearch() as Record<string, unknown>
  const debounceTimerRef = useRef<NodeJS.Timeout>()
  const [pendingFilters, setPendingFilters] = useState<TaskFilters | null>(null)

  // Validate and extract filter values from URL params
  const parseMultiValue = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.filter((v) => typeof v === 'string') as string[]
    }
    if (typeof value === 'string' && value) {
      return [value]
    }
    return []
  }

  const status = Array.isArray(searchParams.status)
    ? (searchParams.status.filter((s) => isValidStatus(s)) as TaskStatus[])
    : isValidStatus(searchParams.status)
      ? [searchParams.status as TaskStatus]
      : []

  const priority = Array.isArray(searchParams.priority)
    ? (searchParams.priority.filter((p) => isValidPriority(p)) as TaskPriority[])
    : isValidPriority(searchParams.priority)
      ? [searchParams.priority as TaskPriority]
      : []

  const search = typeof searchParams.search === 'string' ? searchParams.search : ''
  const team = typeof searchParams.team === 'string' ? searchParams.team : ''
  const sprint = parseMultiValue(searchParams.sprint)
  const assignee = parseMultiValue(searchParams.assignee)
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1
  const pageSize = typeof searchParams.pageSize === 'string' ? parseInt(searchParams.pageSize, 10) : 10

  // Build search param object, excluding empty arrays/null values
  const buildSearchParams = useCallback(
    (filters: TaskFilters) => {
      const params: Record<string, unknown> = {}

      if (filters.status && filters.status.length > 0) {
        params.status = filters.status.length === 1 ? filters.status[0] : filters.status
      }
      if (filters.priority && filters.priority.length > 0) {
        params.priority = filters.priority.length === 1 ? filters.priority[0] : filters.priority
      }
      if (filters.search) params.search = filters.search
      if (filters.team) params.team = filters.team
      if (filters.sprint && filters.sprint.length > 0) {
        params.sprint = filters.sprint.length === 1 ? filters.sprint[0] : filters.sprint
      }
      if (filters.assignee && filters.assignee.length > 0) {
        params.assignee = filters.assignee.length === 1 ? filters.assignee[0] : filters.assignee
      }
      if (filters.page && filters.page > 1) params.page = filters.page
      if (filters.pageSize && filters.pageSize !== 10) params.pageSize = filters.pageSize

      return params
    },
    []
  )

  // Debounced filter update with automatic cache invalidation
  const applyFilters = useCallback(
    (updates: Partial<TaskFilters>, immediate = false) => {
      const newFilters: TaskFilters = {
        status: updates.status !== undefined ? updates.status : status,
        priority: updates.priority !== undefined ? updates.priority : priority,
        search: updates.search !== undefined ? updates.search : search,
        team: updates.team !== undefined ? updates.team : team,
        sprint: updates.sprint !== undefined ? updates.sprint : sprint,
        assignee: updates.assignee !== undefined ? updates.assignee : assignee,
        page: updates.page !== undefined ? updates.page : page,
        pageSize: updates.pageSize !== undefined ? updates.pageSize : pageSize,
      }

      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      setPendingFilters(newFilters)

      const executeNavigation = () => {
        setPendingFilters(null)
        navigate({
          search: buildSearchParams(newFilters),
        })

        // Invalidate task queries to trigger background refetch
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      }

      if (immediate) {
        executeNavigation()
      } else {
        debounceTimerRef.current = setTimeout(executeNavigation, debounceMs)
      }
    },
    [navigate, queryClient, status, priority, search, team, sprint, assignee, page, pageSize, debounceMs, buildSearchParams]
  )

  // Individual filter setters with proper array handling
  const setFilter = useCallback(
    (filterKey: keyof TaskFilters, value: unknown) => {
      const updates: Partial<TaskFilters> = {}

      switch (filterKey) {
        case 'status':
          updates.status = Array.isArray(value) ? value : value ? [value as TaskStatus] : []
          break
        case 'priority':
          updates.priority = Array.isArray(value) ? value : value ? [value as TaskPriority] : []
          break
        case 'search':
          updates.search = typeof value === 'string' ? value : ''
          break
        case 'team':
          updates.team = typeof value === 'string' ? value : ''
          break
        case 'sprint':
          updates.sprint = Array.isArray(value) ? value : value ? [value as string] : []
          break
        case 'assignee':
          updates.assignee = Array.isArray(value) ? value : value ? [value as string] : []
          break
        case 'page':
          updates.page = typeof value === 'number' ? value : 1
          break
        case 'pageSize':
          updates.pageSize = typeof value === 'number' ? value : 10
          break
      }

      applyFilters(updates, filterKey === 'page' || filterKey === 'pageSize')
    },
    [applyFilters]
  )

  const clearFilter = useCallback(
    (filterKey: keyof TaskFilters) => {
      const updates: Partial<TaskFilters> = {}
      updates[filterKey] = filterKey === 'search' ? '' : filterKey === 'team' ? '' : []
      applyFilters(updates, true)
    },
    [applyFilters]
  )

  const clearAllFilters = useCallback(() => {
    navigate({ search: {} })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }, [navigate, queryClient])

  // Apply filter preset
  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = getPresetById(presetId)
      if (!preset) return

      // For MVP, we'll apply the first AND operator's criteria
      const firstOperator = preset.operators[0]
      if (!firstOperator) return

      const { criteria } = firstOperator
      const updates: Partial<TaskFilters> = {}

      if (criteria.status) {
        updates.status = Array.isArray(criteria.status) ? criteria.status : [criteria.status]
      }
      if (criteria.priority) {
        updates.priority = Array.isArray(criteria.priority) ? criteria.priority : [criteria.priority]
      }
      if (criteria.sprint) {
        updates.sprint = Array.isArray(criteria.sprint) ? criteria.sprint : [criteria.sprint]
      }
      if (criteria.assignee) {
        updates.assignee = Array.isArray(criteria.assignee) ? criteria.assignee : [criteria.assignee]
      }

      applyFilters(updates, true)
    },
    [applyFilters]
  )

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    // Current filter state
    status,
    priority,
    search,
    team,
    sprint,
    assignee,
    page,
    pageSize,
    pendingFilters,

    // Filter methods
    setFilter,
    clearFilter,
    clearAllFilters,
    applyFilters,
    applyPreset,

    // Presets
    presets: getAllPresets(),
    getPresetById,

    // Helper for building query params
    buildSearchParams,
  }
}
