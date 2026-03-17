/**
 * useTaskSearchFilters Hook
 *
 * Manages task search filter state with URL synchronization.
 * Supports multi-select status, assignee, priority, sprint, and date range filters.
 */

import { useCallback, useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { TaskSearchFilters, TaskSearchParams } from '../types/task-search'

interface UseTaskSearchFiltersReturn extends TaskSearchFilters {
  page: number
  limit: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  agents?: string[] // Multi-select agents
  sprints?: string[] // Multi-select sprints
  // Filter setters
  setQuery: (q: string) => void
  setStatus: (status: string[]) => void
  setAssigneeId: (id: string | null) => void
  setAssignees: (ids: string[]) => void
  setPriority: (priority: string | null) => void
  setPriorities: (priorities: string[]) => void
  setSprintId: (id: string | null) => void
  setSprints: (ids: string[]) => void
  setDateRange: (from: string | null, to: string | null) => void
  setSorting: (field: string, direction: 'asc' | 'desc') => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  reset: () => void
  hasActiveFilters: boolean
}

/**
 * Hook for managing task search filters with URL state persistence
 *
 * @example
 * ```tsx
 * const {
 *   q,
 *   status,
 *   setQuery,
 *   setStatus,
 *   setPage,
 *   hasActiveFilters,
 * } = useTaskSearchFilters()
 *
 * // Set search term
 * setQuery('authentication')
 *
 * // Set multi-select status
 * setStatus(['in-progress', 'in-review'])
 *
 * // Clear filters
 * reset()
 * ```
 */
export function useTaskSearchFilters(): UseTaskSearchFiltersReturn {
  const navigate = useNavigate({ from: '/' })
  const searchParams = useSearch() as Record<string, unknown>

  // Parse URL search params
  const q = typeof searchParams.q === 'string' ? searchParams.q : ''
  const status = Array.isArray(searchParams.status)
    ? searchParams.status.filter((s): s is string => typeof s === 'string')
    : typeof searchParams.status === 'string'
      ? [searchParams.status]
      : []
  const assigneeId = typeof searchParams.assigneeId === 'string' ? searchParams.assigneeId : undefined
  const agents = Array.isArray(searchParams.agents)
    ? searchParams.agents.filter((a): a is string => typeof a === 'string')
    : typeof searchParams.agents === 'string'
      ? [searchParams.agents]
      : []
  const priority = typeof searchParams.priority === 'string' ? searchParams.priority : undefined
  const priorities = Array.isArray(searchParams.priorities)
    ? searchParams.priorities.filter((p): p is string => typeof p === 'string')
    : typeof searchParams.priorities === 'string'
      ? [searchParams.priorities]
      : []
  const sprintId = typeof searchParams.sprintId === 'string' ? searchParams.sprintId : undefined
  const sprints = Array.isArray(searchParams.sprints)
    ? searchParams.sprints.filter((s): s is string => typeof s === 'string')
    : typeof searchParams.sprints === 'string'
      ? [searchParams.sprints]
      : []
  const dateFrom = typeof searchParams.dateFrom === 'string' ? searchParams.dateFrom : undefined
  const dateTo = typeof searchParams.dateTo === 'string' ? searchParams.dateTo : undefined
  const sortBy = typeof searchParams.sortBy === 'string' ? searchParams.sortBy : undefined
  const sortDir =
    typeof searchParams.sortDir === 'string' && ['asc', 'desc'].includes(searchParams.sortDir)
      ? (searchParams.sortDir as 'asc' | 'desc')
      : 'desc'
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) || 1 : 1
  const limit = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit, 10) || 20 : 20

  // Compute active filter flag
  const hasActiveFilters = useMemo(() => {
    return !!(
      q ||
      status.length > 0 ||
      assigneeId ||
      agents.length > 0 ||
      priority ||
      priorities.length > 0 ||
      sprintId ||
      sprints.length > 0 ||
      dateFrom ||
      dateTo
    )
  }, [q, status, assigneeId, agents, priority, priorities, sprintId, sprints, dateFrom, dateTo])

  // Query setter
  const setQuery = useCallback(
    (value: string) => {
      navigate({
        search: {
          ...searchParams,
          q: value || null,
          page: 1, // Reset to page 1 when query changes
        },
      })
    },
    [navigate, searchParams]
  )

  // Status multi-select setter
  const setStatus = useCallback(
    (newStatus: string[]) => {
      navigate({
        search: {
          ...searchParams,
          status: newStatus.length > 0 ? newStatus : null,
          page: 1,
        },
      })
    },
    [navigate, searchParams]
  )

  // Assignee setter (single)
  const setAssigneeId = useCallback(
    (value: string | null) => {
      navigate({
        search: {
          ...searchParams,
          assigneeId: value,
          page: 1,
        },
      })
    },
    [navigate, searchParams]
  )

  // Assignees multi-select setter
  const setAssignees = useCallback(
    (newAgents: string[]) => {
      navigate({
        search: {
          ...searchParams,
          agents: newAgents.length > 0 ? newAgents : null,
          page: 1,
        },
      })
    },
    [navigate, searchParams]
  )

  // Priority setter (single)
  const setPriority = useCallback(
    (value: string | null) => {
      navigate({
        search: {
          ...searchParams,
          priority: value,
          page: 1,
        },
      })
    },
    [navigate, searchParams]
  )

  // Priorities multi-select setter
  const setPriorities = useCallback(
    (newPriorities: string[]) => {
      navigate({
        search: {
          ...searchParams,
          priorities: newPriorities.length > 0 ? newPriorities : null,
          page: 1,
        },
      })
    },
    [navigate, searchParams]
  )

  // Sprint setter (single)
  const setSprintId = useCallback(
    (value: string | null) => {
      navigate({
        search: {
          ...searchParams,
          sprintId: value,
          page: 1,
        },
      })
    },
    [navigate, searchParams]
  )

  // Sprints multi-select setter
  const setSprints = useCallback(
    (newSprints: string[]) => {
      navigate({
        search: {
          ...searchParams,
          sprints: newSprints.length > 0 ? newSprints : null,
          page: 1,
        },
      })
    },
    [navigate, searchParams]
  )

  // Date range setter
  const setDateRange = useCallback(
    (from: string | null, to: string | null) => {
      navigate({
        search: {
          ...searchParams,
          dateFrom: from,
          dateTo: to,
          page: 1,
        },
      })
    },
    [navigate, searchParams]
  )

  // Sorting setter
  const setSorting = useCallback(
    (field: string, direction: 'asc' | 'desc') => {
      navigate({
        search: {
          ...searchParams,
          sortBy: field,
          sortDir: direction,
        },
      })
    },
    [navigate, searchParams]
  )

  // Pagination setters
  const setPage = useCallback(
    (value: number) => {
      navigate({
        search: {
          ...searchParams,
          page: value > 1 ? value : null,
        },
      })
    },
    [navigate, searchParams]
  )

  const setLimit = useCallback(
    (value: number) => {
      navigate({
        search: {
          ...searchParams,
          limit: value !== 20 ? value : null,
          page: 1,
        },
      })
    },
    [navigate, searchParams]
  )

  // Reset all filters
  const reset = useCallback(() => {
    navigate({
      search: {},
    })
  }, [navigate])

  return {
    q,
    status,
    assigneeId,
    agents,
    priority,
    priorities,
    sprintId,
    sprints,
    dateFrom,
    dateTo,
    page,
    limit,
    sortBy,
    sortDir,
    setQuery,
    setStatus,
    setAssigneeId,
    setAssignees,
    setPriority,
    setPriorities,
    setSprintId,
    setSprints,
    setDateRange,
    setSorting,
    setPage,
    setLimit,
    reset,
    hasActiveFilters,
  }
}
