import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useInfiniteScroll, type PaginatedCursorResponse } from '../useInfiniteScroll'

describe('useInfiniteScroll', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const mockPage1: PaginatedCursorResponse<{ id: string; title: string }> = {
    data: [
      { id: 'item-1', title: 'Item 1' },
      { id: 'item-2', title: 'Item 2' },
    ],
    pageInfo: {
      hasNextPage: true,
      endCursor: 'item-2',
      startCursor: 'item-1',
    },
  }

  const mockPage2: PaginatedCursorResponse<{ id: string; title: string }> = {
    data: [
      { id: 'item-3', title: 'Item 3' },
      { id: 'item-4', title: 'Item 4' },
    ],
    pageInfo: {
      hasNextPage: false,
      endCursor: null,
      startCursor: 'item-3',
    },
  }

  it('should fetch initial page with cursor null', async () => {
    const queryFn = vi.fn(async () => mockPage1)

    const { result } = renderHook(
      () =>
        useInfiniteScroll({
          queryKey: ['items'],
          queryFn,
          pageSize: 10,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(queryFn).toHaveBeenCalledWith(null)
    expect(result.current.data).toEqual(mockPage1.data)
    expect(result.current.hasNextPage).toBe(true)
  })

  it('should fetch next page when fetchNextPage is called', async () => {
    const queryFn = vi.fn(async (cursor) => (cursor ? mockPage2 : mockPage1))

    const { result } = renderHook(
      () =>
        useInfiniteScroll({
          queryKey: ['items'],
          queryFn,
          pageSize: 10,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.data).toEqual(mockPage1.data)

    await act(async () => {
      await result.current.fetchNextPage()
    })

    await waitFor(() => {
      expect(result.current.data).toEqual([...mockPage1.data, ...mockPage2.data])
    })

    expect(result.current.hasNextPage).toBe(false)
  })

  it('should return error when query fails', async () => {
    const testError = new Error('Test error')
    const queryFn = vi.fn(async () => {
      throw testError
    })

    const { result } = renderHook(
      () =>
        useInfiniteScroll({
          queryKey: ['items'],
          queryFn,
          pageSize: 10,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBe(testError)
  })
})
