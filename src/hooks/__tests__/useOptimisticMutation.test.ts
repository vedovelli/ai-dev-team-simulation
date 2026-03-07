import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOptimisticMutation } from '../useOptimisticMutation'
import React from 'react'

describe('useOptimisticMutation', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  describe('optimistic updates', () => {
    it('should apply optimistic update immediately before mutation completes', async () => {
      const queryKey = ['task', '1']
      const initialData = { id: '1', title: 'Task', status: 'pending' as const }
      queryClient.setQueryData(queryKey, initialData)

      const { result } = renderHook(
        () =>
          useOptimisticMutation({
            mutationFn: async (variables) => {
              await new Promise((resolve) => setTimeout(resolve, 100))
              return { ...initialData, ...variables }
            },
            optimisticUpdate: (variables, currentData) => ({
              ...currentData,
              ...variables,
            }),
            queryKey,
          }),
        { wrapper }
      )

      result.current.mutate({ status: 'done' })

      // Optimistic update should be applied immediately
      let cachedData = queryClient.getQueryData(queryKey)
      expect(cachedData).toEqual({ id: '1', title: 'Task', status: 'done' })

      // Wait for mutation to complete
      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      // Final data should match server response
      cachedData = queryClient.getQueryData(queryKey)
      expect(cachedData).toEqual({ id: '1', title: 'Task', status: 'done' })
    })

    it('should support complex optimistic updates with transformations', async () => {
      interface Task {
        id: string
        title: string
        status: string
        updatedAt: string
      }

      const queryKey = ['task', '2']
      const initialData: Task = {
        id: '2',
        title: 'Complex Task',
        status: 'pending',
        updatedAt: '2026-03-06T00:00:00Z',
      }
      queryClient.setQueryData(queryKey, initialData)

      const { result } = renderHook(
        () =>
          useOptimisticMutation({
            mutationFn: async (variables: Partial<Task>) => {
              await new Promise((resolve) => setTimeout(resolve, 50))
              return { ...initialData, ...variables, updatedAt: new Date().toISOString() }
            },
            optimisticUpdate: (variables, currentData) => ({
              ...currentData!,
              ...variables,
              updatedAt: new Date().toISOString(),
            }),
            queryKey,
          }),
        { wrapper }
      )

      result.current.mutate({ status: 'in-progress', title: 'Updated Title' })

      const cachedData = queryClient.getQueryData<Task>(queryKey)
      expect(cachedData?.status).toBe('in-progress')
      expect(cachedData?.title).toBe('Updated Title')
      expect(cachedData?.updatedAt).toBeDefined()
    })
  })

  describe('rollback on error', () => {
    it('should rollback to previous data when mutation fails', async () => {
      const queryKey = ['task', '3']
      const initialData = { id: '3', title: 'Task', status: 'pending' as const }
      queryClient.setQueryData(queryKey, initialData)

      const { result } = renderHook(
        () =>
          useOptimisticMutation({
            mutationFn: async () => {
              await new Promise((resolve) => setTimeout(resolve, 50))
              throw new Error('Update failed')
            },
            optimisticUpdate: (variables, currentData) => ({
              ...currentData,
              ...variables,
            }),
            queryKey,
          }),
        { wrapper }
      )

      result.current.mutate({ status: 'done' })

      // Optimistic update should be applied
      let cachedData = queryClient.getQueryData(queryKey)
      expect(cachedData).toEqual({ id: '3', title: 'Task', status: 'done' })

      // Wait for error
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Should rollback to previous data
      cachedData = queryClient.getQueryData(queryKey)
      expect(cachedData).toEqual(initialData)
      expect(result.current.error?.message).toBe('Update failed')
    })

    it('should handle rollback when there is no previous data', async () => {
      const queryKey = ['new-item']
      // No initial data set

      const { result } = renderHook(
        () =>
          useOptimisticMutation({
            mutationFn: async () => {
              throw new Error('Creation failed')
            },
            optimisticUpdate: (variables) => variables,
            queryKey,
          }),
        { wrapper }
      )

      result.current.mutate({ id: '1', title: 'New Task' })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Should invalidate the query instead of rollback
      expect(queryClient.getQueryData(queryKey)).toBeUndefined()
    })
  })

  describe('query invalidation', () => {
    it('should invalidate only the main queryKey on success by default', async () => {
      const queryKey = ['task', '4']
      const initialData = { id: '4', title: 'Task' }
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      queryClient.setQueryData(queryKey, initialData)

      const { result } = renderHook(
        () =>
          useOptimisticMutation({
            mutationFn: async (variables) => ({ ...initialData, ...variables }),
            optimisticUpdate: (variables, currentData) => ({ ...currentData, ...variables }),
            queryKey,
          }),
        { wrapper }
      )

      result.current.mutate({ title: 'Updated' })

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey })
      invalidateQueriesSpy.mockRestore()
    })

    it('should use custom invalidateKeys function when provided', async () => {
      const taskKey = ['task', '5']
      const sprintKey = ['sprint', '1', 'tasks']
      const metricsKey = ['sprint', '1', 'metrics']
      const initialData = { id: '5', sprintId: '1', title: 'Task' }

      queryClient.setQueryData(taskKey, initialData)
      queryClient.setQueryData(sprintKey, [initialData])
      queryClient.setQueryData(metricsKey, { completedCount: 0 })

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(
        () =>
          useOptimisticMutation({
            mutationFn: async (variables) => ({ ...initialData, ...variables }),
            optimisticUpdate: (variables, currentData) => ({ ...currentData, ...variables }),
            queryKey: taskKey,
            invalidateKeys: (data, variables) => [
              ['sprint', variables.sprintId, 'tasks'],
              ['sprint', variables.sprintId, 'metrics'],
            ],
          }),
        { wrapper }
      )

      result.current.mutate({ sprintId: '1', title: 'Updated' })

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: sprintKey })
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: metricsKey })
      invalidateQueriesSpy.mockRestore()
    })

    it('should support batch invalidation for multiple queries', async () => {
      const queryKey = ['item', '6']
      const initialData = { id: '6', title: 'Item' }
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      queryClient.setQueryData(queryKey, initialData)

      const { result } = renderHook(
        () =>
          useOptimisticMutation({
            mutationFn: async (variables) => ({ ...initialData, ...variables }),
            optimisticUpdate: (variables, currentData) => ({ ...currentData, ...variables }),
            queryKey,
            invalidateKeys: () => [
              ['items', 'list'],
              ['items', 'search'],
              ['dashboard'],
            ],
          }),
        { wrapper }
      )

      result.current.mutate({ title: 'Updated Item' })

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(3)
      invalidateQueriesSpy.mockRestore()
    })
  })

  describe('callback handling', () => {
    it('should call onSuccess callback', async () => {
      const queryKey = ['success-test']
      const onSuccess = vi.fn()
      queryClient.setQueryData(queryKey, { id: '1' })

      const { result } = renderHook(
        () =>
          useOptimisticMutation({
            mutationFn: async (vars) => ({ ...vars, success: true }),
            optimisticUpdate: (variables) => variables,
            queryKey,
            onSuccess,
          }),
        { wrapper }
      )

      result.current.mutate({ id: '1', name: 'Test' })

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('should call onError callback on mutation error', async () => {
      const queryKey = ['error-test']
      const onError = vi.fn()
      queryClient.setQueryData(queryKey, { id: '1' })

      const { result } = renderHook(
        () =>
          useOptimisticMutation({
            mutationFn: async () => {
              throw new Error('Test error')
            },
            optimisticUpdate: (variables) => variables,
            queryKey,
            onError,
          }),
        { wrapper }
      )

      result.current.mutate({ id: '1' })

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })
    })

    it('should provide both callbacks and inline callbacks', async () => {
      const queryKey = ['callback-test']
      const onSuccessOption = vi.fn()
      const onSuccessInline = vi.fn()
      queryClient.setQueryData(queryKey, { id: '1' })

      const { result } = renderHook(
        () =>
          useOptimisticMutation({
            mutationFn: async (vars) => ({ ...vars, success: true }),
            optimisticUpdate: (variables) => variables,
            queryKey,
            onSuccess: onSuccessOption,
          }),
        { wrapper }
      )

      result.current.mutate({ id: '1' }, { onSuccess: onSuccessInline })

      await waitFor(() => {
        expect(onSuccessOption).toHaveBeenCalled()
        expect(onSuccessInline).toHaveBeenCalled()
      })
    })
  })

  describe('mutation state', () => {
    it('should provide isPending state correctly', async () => {
      const queryKey = ['pending-test']
      queryClient.setQueryData(queryKey, { value: 'test' })

      const { result } = renderHook(
        () =>
          useOptimisticMutation({
            mutationFn: async () => {
              await new Promise((resolve) => setTimeout(resolve, 100))
              return { value: 'updated' }
            },
            optimisticUpdate: (variables) => variables,
            queryKey,
          }),
        { wrapper }
      )

      expect(result.current.isPending).toBe(false)

      result.current.mutate({ value: 'updated' })
      expect(result.current.isPending).toBe(true)

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })
    })

    it('should provide error state on failure', async () => {
      const queryKey = ['error-state-test']
      queryClient.setQueryData(queryKey, { id: '1' })

      const { result } = renderHook(
        () =>
          useOptimisticMutation({
            mutationFn: async () => {
              throw new Error('Test error')
            },
            optimisticUpdate: (variables) => variables,
            queryKey,
          }),
        { wrapper }
      )

      expect(result.current.isError).toBe(false)
      expect(result.current.error).toBeNull()

      result.current.mutate({ id: '1' })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
        expect(result.current.error?.message).toBe('Test error')
      })
    })

    it('should provide data on success', async () => {
      const queryKey = ['data-test']
      const responseData = { id: '1', name: 'Updated' }
      queryClient.setQueryData(queryKey, { id: '1', name: 'Original' })

      const { result } = renderHook(
        () =>
          useOptimisticMutation({
            mutationFn: async () => responseData,
            optimisticUpdate: (variables, currentData) => ({
              ...currentData,
              ...variables,
            }),
            queryKey,
          }),
        { wrapper }
      )

      expect(result.current.data).toBeNull()

      result.current.mutate({ name: 'Updated' })

      await waitFor(() => {
        expect(result.current.data).toEqual(responseData)
      })
    })
  })

  describe('async mutations', () => {
    it('should support mutateAsync', async () => {
      const queryKey = ['async-test']
      const responseData = { id: '1', status: 'done' }
      queryClient.setQueryData(queryKey, { id: '1', status: 'pending' })

      const { result } = renderHook(
        () =>
          useOptimisticMutation({
            mutationFn: async () => responseData,
            optimisticUpdate: (variables, currentData) => ({
              ...currentData,
              ...variables,
            }),
            queryKey,
          }),
        { wrapper }
      )

      const data = await result.current.mutateAsync({ status: 'done' })

      expect(data).toEqual(responseData)
    })

    it('should throw on mutateAsync error', async () => {
      const queryKey = ['async-error-test']
      queryClient.setQueryData(queryKey, { id: '1' })

      const { result } = renderHook(
        () =>
          useOptimisticMutation({
            mutationFn: async () => {
              throw new Error('Async error')
            },
            optimisticUpdate: (variables) => variables,
            queryKey,
          }),
        { wrapper }
      )

      await expect(result.current.mutateAsync({ id: '1' })).rejects.toThrow('Async error')
    })
  })
})
