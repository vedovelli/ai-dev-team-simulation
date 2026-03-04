import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOptimisticUpdate } from '../useOptimisticUpdate'
import React from 'react'

describe('useOptimisticUpdate', () => {
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

  it('should apply optimistic update immediately', async () => {
    const queryKey = ['user', '1']
    const initialData = { id: '1', name: 'John', email: 'john@example.com' }
    queryClient.setQueryData(queryKey, initialData)

    const { result } = renderHook(
      () =>
        useOptimisticUpdate({
          mutationFn: async (newData) => {
            await new Promise((resolve) => setTimeout(resolve, 100))
            return { ...initialData, ...newData }
          },
          optimisticData: (variables, currentData) => ({
            ...currentData,
            ...variables,
          }),
          queryKey,
        }),
      { wrapper }
    )

    result.current.mutate({ name: 'Jane' })

    // Check optimistic update is applied immediately
    const cachedData = queryClient.getQueryData(queryKey)
    expect(cachedData).toEqual({ id: '1', name: 'Jane', email: 'john@example.com' })

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })
  })

  it('should rollback on mutation error', async () => {
    const queryKey = ['user', '2']
    const initialData = { id: '2', name: 'Bob', email: 'bob@example.com' }
    queryClient.setQueryData(queryKey, initialData)

    const { result } = renderHook(
      () =>
        useOptimisticUpdate({
          mutationFn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 50))
            throw new Error('Update failed')
          },
          optimisticData: (variables, currentData) => ({
            ...currentData,
            ...variables,
          }),
          queryKey,
        }),
      { wrapper }
    )

    result.current.mutate({ name: 'Charlie' })

    // Check optimistic update
    let cachedData = queryClient.getQueryData(queryKey)
    expect(cachedData).toEqual({ id: '2', name: 'Charlie', email: 'bob@example.com' })

    // Wait for error
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // Check rollback
    cachedData = queryClient.getQueryData(queryKey)
    expect(cachedData).toEqual(initialData)
  })

  it('should handle successful mutation', async () => {
    const queryKey = ['item', '3']
    const initialData = { id: '3', title: 'Task', completed: false }
    const updatedData = { id: '3', title: 'Task Updated', completed: true }
    queryClient.setQueryData(queryKey, initialData)

    const mutationFn = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
      return updatedData
    })

    const { result } = renderHook(
      () =>
        useOptimisticUpdate({
          mutationFn,
          optimisticData: (variables) => ({ ...initialData, ...variables }),
          queryKey,
        }),
      { wrapper }
    )

    result.current.mutate({ title: 'Task Updated', completed: true })

    await waitFor(() => {
      expect(mutationFn).toHaveBeenCalled()
    })

    // Check final data matches server response
    const cachedData = queryClient.getQueryData(queryKey)
    expect(cachedData).toEqual(updatedData)
    expect(result.current.data).toEqual(updatedData)
  })

  it('should provide isPending state', async () => {
    const queryKey = ['test']
    queryClient.setQueryData(queryKey, { value: 'test' })

    const { result } = renderHook(
      () =>
        useOptimisticUpdate({
          mutationFn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 100))
            return { value: 'updated' }
          },
          optimisticData: (variables) => variables,
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

  it('should call onSuccess callback on successful mutation', async () => {
    const queryKey = ['success-test']
    const onSuccess = vi.fn()
    queryClient.setQueryData(queryKey, { id: '1' })

    const { result } = renderHook(
      () =>
        useOptimisticUpdate({
          mutationFn: async (vars) => ({ ...vars, success: true }),
          optimisticData: (variables) => variables,
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
        useOptimisticUpdate({
          mutationFn: async () => {
            throw new Error('Test error')
          },
          optimisticData: (variables) => variables,
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
})
