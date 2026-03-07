import { useState, useMemo, useCallback } from 'react'
import type { Task } from '../types/task'
import type { TaskStatus, TaskPriority } from '../types/task'

export interface TaskFilters {
  status?: TaskStatus
  assignee?: string
  sprint?: string
}

export interface UseTaskQueueTableOptions {
  data: Task[]
  initialSortKey?: keyof Task
  initialSortOrder?: 'asc' | 'desc'
}

export interface UseTaskQueueTableReturn {
  sortedAndFilteredData: Task[]
  selectedTaskIds: Set<string>
  sortKey: keyof Task | null
  sortOrder: 'asc' | 'desc'
  filters: TaskFilters
  handleSort: (key: keyof Task) => void
  handleFilterChange: (filters: TaskFilters) => void
  toggleSelectTask: (taskId: string) => void
  selectAllTasks: (taskIds: string[]) => void
  clearSelection: () => void
  isTaskSelected: (taskId: string) => boolean
  selectedCount: number
}

/**
 * Enhanced hook for managing task queue table with multi-select, sorting, and filtering.
 * Provides capabilities for bulk operations and advanced task filtering.
 *
 * @param options - Configuration for the hook
 * @returns Table state and handlers for task queue management
 *
 * @example
 * ```tsx
 * const {
 *   sortedAndFilteredData,
 *   selectedTaskIds,
 *   handleSort,
 *   toggleSelectTask,
 * } = useTaskQueueTable({ data: tasks })
 * ```
 */
export function useTaskQueueTable({
  data,
  initialSortKey = 'priority',
  initialSortOrder = 'asc',
}: UseTaskQueueTableOptions): UseTaskQueueTableReturn {
  const [sortKey, setSortKey] = useState<keyof Task | null>(initialSortKey)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<TaskFilters>({})

  const handleSort = useCallback((key: keyof Task) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'))
        return key
      }
      setSortOrder('asc')
      return key
    })
  }, [])

  const handleFilterChange = useCallback((newFilters: TaskFilters) => {
    setFilters(newFilters)
  }, [])

  const toggleSelectTask = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }, [])

  const selectAllTasks = useCallback((taskIds: string[]) => {
    setSelectedTaskIds(new Set(taskIds))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedTaskIds(new Set())
  }, [])

  const isTaskSelected = useCallback(
    (taskId: string) => selectedTaskIds.has(taskId),
    [selectedTaskIds]
  )

  const sortedAndFilteredData = useMemo(() => {
    let result = [...data]

    // Apply filters
    if (filters.status) {
      result = result.filter((task) => task.status === filters.status)
    }
    if (filters.assignee) {
      result = result.filter((task) => task.assignee === filters.assignee)
    }
    if (filters.sprint) {
      result = result.filter((task) => task.sprint === filters.sprint)
    }

    // Apply sorting
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey]
        const bVal = b[sortKey]

        // Handle priority specially - sort by priority level
        if (sortKey === 'priority') {
          const priorityOrder = { low: 0, medium: 1, high: 2 }
          const aPriority = priorityOrder[aVal as TaskPriority] ?? 0
          const bPriority = priorityOrder[bVal as TaskPriority] ?? 0
          return sortOrder === 'asc' ? aPriority - bPriority : bPriority - aPriority
        }

        // Handle undefined/null values
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return sortOrder === 'asc' ? 1 : -1
        if (bVal == null) return sortOrder === 'asc' ? -1 : 1

        // Handle string comparison
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          const comparison = aVal.localeCompare(bVal)
          return sortOrder === 'asc' ? comparison : -comparison
        }

        // Handle numeric comparison
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
        }

        // Fallback comparison
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, filters, sortKey, sortOrder])

  return {
    sortedAndFilteredData,
    selectedTaskIds,
    sortKey,
    sortOrder,
    filters,
    handleSort,
    handleFilterChange,
    toggleSelectTask,
    selectAllTasks,
    clearSelection,
    isTaskSelected,
    selectedCount: selectedTaskIds.size,
  }
}
