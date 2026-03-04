import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOptimisticUpdate } from '../useOptimisticUpdate'
import { usePaginatedQuery, type PaginatedResponse } from '../usePaginatedQuery'
import React from 'react'

describe('Integration: Optimistic Updates + Pagination', () => {
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

  it('should update item in paginated list with optimistic update', async () => {
    const mockItems = [
      { id: '1', title: 'Item 1', completed: false },
      { id: '2', title: 'Item 2', completed: false },
    ]

    const paginatedResponse: PaginatedResponse<{ id: string; title: string; completed: boolean }> =
      {
        data: mockItems,
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      }

    const queryKey = ['items', 1, 10]
    queryClient.setQueryData(queryKey, paginatedResponse)

    const { result: paginationResult } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ['items'],
          queryFn: async () => paginatedResponse,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(paginationResult.current.data).toHaveLength(2)
    })

    // Now use optimistic update to modify an item
    const { result: updateResult } = renderHook(
      () =>
        useOptimisticUpdate({
          mutationFn: async (variables) => {
            // Simulate server update
            await new Promise((resolve) => setTimeout(resolve, 50))
            return variables
          },
          optimisticData: (variables, currentData) => {
            // Update the list optimistically
            if (!currentData || !('data' in currentData)) return variables

            const updatedData = {
              ...currentData,
              data: currentData.data.map((item: any) =>
                item.id === variables.id ? { ...item, ...variables } : item
              ),
            }
            return updatedData
          },
          queryKey,
        }),
      { wrapper }
    )

    // Perform optimistic update
    act(() => {
      updateResult.current.mutate({ id: '1', title: 'Item 1 Updated', completed: true })
    })

    // Check optimistic update is applied
    await waitFor(() => {
      const cachedList = queryClient.getQueryData<PaginatedResponse<any>>(queryKey)
      expect(cachedList?.data[0]).toMatchObject({
        id: '1',
        title: 'Item 1 Updated',
        completed: true,
      })
    })
  })

  it('should handle concurrent updates to paginated data', async () => {
    const baseResponse: PaginatedResponse<{ id: string; value: number }> = {
      data: [
        { id: '1', value: 10 },
        { id: '2', value: 20 },
      ],
      total: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    }

    const queryKey = ['counter', 1, 10]
    queryClient.setQueryData(queryKey, baseResponse)

    const { result } = renderHook(
      () =>
        useOptimisticUpdate({
          mutationFn: async (variables) => {
            await new Promise((resolve) => setTimeout(resolve, 30))
            return variables
          },
          optimisticData: (variables, currentData) => {
            if (!currentData || !('data' in currentData)) return variables

            return {
              ...currentData,
              data: currentData.data.map((item: any) =>
                item.id === variables.id ? { ...item, value: variables.value } : item
              ),
            }
          },
          queryKey,
        }),
      { wrapper }
    )

    // Perform two concurrent updates
    act(() => {
      result.current.mutate({ id: '1', value: 15 })
      result.current.mutate({ id: '2', value: 25 })
    })

    await waitFor(() => {
      const cachedData = queryClient.getQueryData<PaginatedResponse<any>>(queryKey)
      expect(cachedData?.data).toContainEqual({ id: '1', value: 15 })
      expect(cachedData?.data).toContainEqual({ id: '2', value: 25 })
    })
  })

  it('should rollback failed update in paginated context', async () => {
    const originalData: PaginatedResponse<{ id: string; name: string }> = {
      data: [{ id: '1', name: 'Original' }],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    }

    const queryKey = ['items-rollback', 1, 10]
    queryClient.setQueryData(queryKey, originalData)

    const { result } = renderHook(
      () =>
        useOptimisticUpdate({
          mutationFn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 30))
            throw new Error('Server error')
          },
          optimisticData: (variables, currentData) => {
            if (!currentData || !('data' in currentData)) return variables

            return {
              ...currentData,
              data: currentData.data.map((item: any) =>
                item.id === variables.id ? { ...item, ...variables } : item
              ),
            }
          },
          queryKey,
        }),
      { wrapper }
    )

    act(() => {
      result.current.mutate({ id: '1', name: 'Updated' })
    })

    // Wait for optimistic update
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Verify optimistic update was applied
    let cachedData = queryClient.getQueryData<PaginatedResponse<any>>(queryKey)
    expect(cachedData?.data[0].name).toBe('Updated')

    // Wait for error and rollback
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // Verify rollback
    cachedData = queryClient.getQueryData<PaginatedResponse<any>>(queryKey)
    expect(cachedData?.data[0].name).toBe('Original')
  })
})
