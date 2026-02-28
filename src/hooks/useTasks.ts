import { useCallback, useState } from 'react'
import type { TaskFilters, TaskSorting } from '../types/task'
import {
  useCreateTask,
  useTaskQuery,
  useTasksQuery,
  useUpdateTask,
  useValidateTaskName,
} from '../api/tasks'

export function useTasksList(initialPage: number = 1, initialLimit: number = 10) {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [filters, setFilters] = useState<TaskFilters>({})
  const [sorting, setSorting] = useState<TaskSorting>({ field: 'createdAt', direction: 'desc' })

  const { data, isLoading, error, isFetching } = useTasksQuery(page, limit, filters, sorting)

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }, [])

  const handleFiltersChange = useCallback((newFilters: TaskFilters) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  const handleSortingChange = useCallback((newSorting: TaskSorting) => {
    setSorting(newSorting)
  }, [])

  return {
    data,
    isLoading,
    error,
    isFetching,
    page,
    limit,
    filters,
    sorting,
    handlePageChange,
    handleLimitChange,
    handleFiltersChange,
    handleSortingChange,
  }
}

export function useTask(id: string) {
  const { data, isLoading, error } = useTaskQuery(id)

  return { task: data, isLoading, error }
}

export function useTaskMutations() {
  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()

  return {
    create: createMutation,
    update: updateMutation,
  }
}

export function useAsyncTaskNameValidation() {
  const validateMutation = useValidateTaskName()

  return useCallback(
    async (name: string) => {
      try {
        const isValid = await validateMutation.mutateAsync(name)
        return isValid ? undefined : 'This task name is already in use'
      } catch (error) {
        return 'Failed to validate task name'
      }
    },
    [validateMutation]
  )
}
