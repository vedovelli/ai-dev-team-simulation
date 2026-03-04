import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePaginatedQuery, type PaginatedResponse } from '../usePaginatedQuery'
import React from 'react'

describe('usePaginatedQuery', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  const mockData: PaginatedResponse<{ id: string; name: string }> = {
    data: [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ],
    total: 25,
    page: 1,
    pageSize: 10,
    totalPages: 3,
  }

  it('should fetch initial page', async () => {
    const queryFn = vi.fn(async () => mockData)

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ['items'],
          queryFn,
          initialPageSize: 10,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.data).toEqual(mockData.data)
    expect(result.current.total).toBe(25)
    expect(result.current.page).toBe(1)
    expect(result.current.totalPages).toBe(3)
  })

  it('should navigate to next page', async () => {
    const queryFn = vi.fn(async (params) => {
      if (params.page === 2) {
        return {
          data: [
            { id: '3', name: 'Item 3' },
            { id: '4', name: 'Item 4' },
          ],
          total: 25,
          page: 2,
          pageSize: 10,
          totalPages: 3,
        }
      }
      return mockData
    })

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ['items'],
          queryFn,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    act(() => {
      result.current.nextPage()
    })

    await waitFor(() => {
      expect(result.current.page).toBe(2)
    })

    expect(result.current.data).toEqual([
      { id: '3', name: 'Item 3' },
      { id: '4', name: 'Item 4' },
    ])
  })

  it('should navigate to previous page', async () => {
    const queryFn = vi.fn(async () => mockData)

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ['items'],
          queryFn,
          initialPage: 2,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.page).toBe(2)
    })

    act(() => {
      result.current.previousPage()
    })

    expect(result.current.page).toBe(1)
  })

  it('should go to specific page', async () => {
    const queryFn = vi.fn(async () => mockData)

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ['items'],
          queryFn,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    act(() => {
      result.current.goToPage(3)
    })

    expect(result.current.page).toBe(3)
  })

  it('should not go to invalid page', async () => {
    const queryFn = vi.fn(async () => mockData)

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ['items'],
          queryFn,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // Try to go to page 0
    act(() => {
      result.current.goToPage(0)
    })
    expect(result.current.page).toBe(1)

    // Try to go beyond totalPages
    act(() => {
      result.current.goToPage(10)
    })
    expect(result.current.page).toBe(1)
  })

  it('should change page size and reset to page 1', async () => {
    const queryFn = vi.fn(async () => mockData)

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ['items'],
          queryFn,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.pageSize).toBe(10)
    })

    act(() => {
      result.current.setPageSize(20)
    })

    expect(result.current.pageSize).toBe(20)
    expect(result.current.page).toBe(1)
  })

  it('should provide pagination metadata', async () => {
    const queryFn = vi.fn(async () => mockData)

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ['items'],
          queryFn,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.canNextPage).toBe(true)
    expect(result.current.canPreviousPage).toBe(false)
    expect(result.current.total).toBe(25)
  })

  it('should handle query errors', async () => {
    const testError = new Error('Fetch failed')
    const queryFn = vi.fn(async () => {
      throw testError
    })

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ['items'],
          queryFn,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBe(testError)
    expect(result.current.data).toEqual([])
  })

  it('should refetch when page changes', async () => {
    const queryFn = vi.fn(async () => mockData)

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ['items'],
          queryFn,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    const initialCallCount = queryFn.mock.calls.length

    act(() => {
      result.current.nextPage()
    })

    await waitFor(() => {
      expect(queryFn.mock.calls.length).toBe(initialCallCount + 1)
    })
  })
})
