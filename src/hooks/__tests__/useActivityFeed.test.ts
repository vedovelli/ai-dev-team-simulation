import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useActivityFeed } from '../useActivityFeed'
import React from 'react'

describe('useActivityFeed', () => {
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

  describe('polling behavior', () => {
    it('should fetch activity events with correct query key', async () => {
      const mockEvents = [
        {
          id: 'evt-1',
          type: 'task_created' as const,
          actor: 'alice',
          timestamp: new Date().toISOString(),
          metadata: { title: 'Test task' },
          reactions: {},
        },
      ]

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockEvents }),
        } as Response)
      )

      const { result } = renderHook(() => useActivityFeed({ limit: 50 }), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockEvents)
    })

    it('should apply stale time and gc time correctly', async () => {
      const { result } = renderHook(() => useActivityFeed({ limit: 50 }), {
        wrapper,
      })

      const queryKey = ['activity', 'feed', { limit: 50, filter: undefined }]
      const query = queryClient.getQueryCache().find({ queryKey })

      expect(query?.getStaleTime()).toBe(5000) // 5s stale time
      expect(query?.gcTime).toBe(60000) // 1min gc time
    })

    it('should respect custom refetch interval', () => {
      const { result } = renderHook(
        () => useActivityFeed({ limit: 50, refetchInterval: 20000 }),
        { wrapper }
      )

      const queryKey = ['activity', 'feed', { limit: 50, filter: undefined }]
      const query = queryClient.getQueryCache().find({ queryKey })

      expect(query?.options.refetchInterval).toBe(20000)
    })

    it('should handle errors gracefully', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        } as Response)
      )

      const { result } = renderHook(() => useActivityFeed({ limit: 50 }), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('query parameters', () => {
    it('should include limit in query parameters', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      )

      renderHook(() => useActivityFeed({ limit: 100 }), { wrapper })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('limit=100'),
          expect.anything()
        )
      })
    })

    it('should include filter in query parameters when provided', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      )

      renderHook(() => useActivityFeed({ limit: 50, filter: 'task_created' }), {
        wrapper,
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('filter=task_created'),
          expect.anything()
        )
      })
    })
  })
})
