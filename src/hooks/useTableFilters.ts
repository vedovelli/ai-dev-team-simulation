import { useState, useCallback, useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { ColumnFiltersState, SortingState } from '@tanstack/react-table'
import type { TaskStatus, TaskPriority } from '../types/task'

export interface TableFiltersState {
  columnFilters: ColumnFiltersState
  sorting: SortingState
  dateRange?: {
    from?: string
    to?: string
  }
}

/**
 * Reusable hook for managing TanStack Table filter and sort state via URL params
 * Handles persistence and shareability of filtered views
 */
export function useTableFilters() {
  const navigate = useNavigate()
  const searchParams = useSearch() as Record<string, unknown>

  // Parse sorting from URL params (e.g., sortBy=title&sortOrder=asc)
  const sortBy = typeof searchParams.sortBy === 'string' ? searchParams.sortBy : null
  const sortOrder = typeof searchParams.sortOrder === 'string' ? searchParams.sortOrder : null

  const sorting = useMemo<SortingState>(() => {
    if (sortBy) {
      return [{ id: sortBy, desc: sortOrder === 'desc' }]
    }
    return []
  }, [sortBy, sortOrder])

  // Parse column filters from URL params
  // Examples: status=done, priority=high,medium, dateFrom=2024-01-01
  const status = typeof searchParams.status === 'string' ? searchParams.status : null
  const priority = typeof searchParams.priority === 'string' ? searchParams.priority : null
  const search = typeof searchParams.search === 'string' ? searchParams.search : ''
  const team = typeof searchParams.team === 'string' ? searchParams.team : ''
  const assignee = typeof searchParams.assignee === 'string' ? searchParams.assignee : ''
  const dateFrom = typeof searchParams.dateFrom === 'string' ? searchParams.dateFrom : null
  const dateTo = typeof searchParams.dateTo === 'string' ? searchParams.dateTo : null

  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = []

    if (status) {
      filters.push({ id: 'status', value: status })
    }
    if (priority) {
      filters.push({ id: 'priority', value: priority })
    }
    if (search) {
      filters.push({ id: 'title', value: search })
    }
    if (team) {
      filters.push({ id: 'team', value: team })
    }
    if (assignee) {
      filters.push({ id: 'assignee', value: assignee })
    }

    return filters
  }, [status, priority, search, team, assignee])

  const setSorting = useCallback(
    (newSorting: SortingState) => {
      const sort = newSorting[0]
      navigate({
        search: {
          ...searchParams,
          sortBy: sort?.id || null,
          sortOrder: sort?.desc ? 'desc' : 'asc',
        },
      })
    },
    [navigate, searchParams]
  )

  const setColumnFilters = useCallback(
    (newFilters: ColumnFiltersState) => {
      const filterMap: Record<string, string | null> = {
        status: null,
        priority: null,
        title: null,
        team: null,
        assignee: null,
      }

      newFilters.forEach((filter) => {
        if (filter.id === 'title') {
          filterMap.search = filter.value as string
        } else if (filter.id in filterMap) {
          filterMap[filter.id] = filter.value as string
        }
      })

      navigate({
        search: {
          ...searchParams,
          status: filterMap.status,
          priority: filterMap.priority,
          search: filterMap.search,
          team: filterMap.team,
          assignee: filterMap.assignee,
        },
      })
    },
    [navigate, searchParams]
  )

  const setDateRange = useCallback(
    (from?: string, to?: string) => {
      navigate({
        search: {
          ...searchParams,
          dateFrom: from || null,
          dateTo: to || null,
        },
      })
    },
    [navigate, searchParams]
  )

  const clearAllFilters = useCallback(() => {
    navigate({
      search: {},
    })
  }, [navigate])

  const hasActiveFilters = columnFilters.length > 0 || sorting.length > 0 || dateFrom || dateTo

  return {
    columnFilters,
    sorting,
    setSorting,
    setColumnFilters,
    dateRange: { from: dateFrom, to: dateTo },
    setDateRange,
    clearAllFilters,
    hasActiveFilters,
    // Convenience accessors
    status,
    priority,
    search,
    team,
    assignee,
  }
}
