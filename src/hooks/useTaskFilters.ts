import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import { isValidStatus, isValidPriority } from '../utils/filterValidation'
import type { TaskStatus, TaskPriority } from '../types/task'

export interface TaskFilters {
  status?: TaskStatus | null
  priority?: TaskPriority | null
  search?: string
  team?: string
  sprint?: string
  assignee?: string
}

/**
 * Hook that syncs task filters with Router search params
 * Handles invalid params gracefully by clearing them with warnings
 */
export function useTaskFilters() {
  const navigate = useNavigate()
  const searchParams = useSearch() as Record<string, unknown>

  // Validate and extract filter values
  const status = isValidStatus(searchParams.status) ? searchParams.status : null
  const priority = isValidPriority(searchParams.priority)
    ? searchParams.priority
    : null
  const search = typeof searchParams.search === 'string' ? searchParams.search : ''
  const team = typeof searchParams.team === 'string' ? searchParams.team : ''
  const sprint =
    typeof searchParams.sprint === 'string' ? searchParams.sprint : ''
  const assignee =
    typeof searchParams.assignee === 'string' ? searchParams.assignee : ''

  const updateFilter = useCallback(
    (updates: Partial<TaskFilters>) => {
      navigate({
        search: {
          status: updates.status !== undefined ? updates.status : status,
          priority:
            updates.priority !== undefined ? updates.priority : priority,
          search: updates.search !== undefined ? updates.search : search,
          team: updates.team !== undefined ? updates.team : team,
          sprint: updates.sprint !== undefined ? updates.sprint : sprint,
          assignee:
            updates.assignee !== undefined ? updates.assignee : assignee,
        },
      })
    },
    [navigate, status, priority, search, team, sprint, assignee]
  )

  const clearAllFilters = useCallback(() => {
    navigate({
      search: {},
    })
  }, [navigate])

  return {
    status,
    priority,
    search,
    team,
    sprint,
    assignee,
    updateFilter,
    clearAllFilters,
  }
}
