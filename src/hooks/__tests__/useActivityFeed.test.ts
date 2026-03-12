import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useActivityFeed } from '../useActivityFeed'
import { queryKeys } from '../../lib/queryKeys'
import type { ActivityFeedResponse } from '../../types/activity'
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
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  describe('Query Key Structure & Selective Cache Invalidation', () => {
    it('should use correct query key for sprint-level feed', async () => {
      const mockData: ActivityFeedResponse = {
        events: [],
        nextCursor: null,
        hasMore: false,
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        } as Response)
      )

      renderHook(() => useActivityFeed({ sprintId: 'sprint-1', limit: 50 }), {
        wrapper,
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const expectedKey = queryKeys.activity.feed('sprint', 'sprint-1')
      const query = queryClient.getQueryCache().find({ queryKey: expectedKey })

      expect(query).toBeDefined()
      expect(query?.queryKey).toEqual(expectedKey)
    })

    it('should use correct query key for task-level feed', async () => {
      const mockData: ActivityFeedResponse = {
        events: [],
        nextCursor: null,
        hasMore: false,
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        } as Response)
      )

      renderHook(
        () => useActivityFeed({ entityType: 'task', entityId: 'task-123', limit: 50 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const expectedKey = queryKeys.activity.feed('task', 'task-123')
      const query = queryClient.getQueryCache().find({ queryKey: expectedKey })

      expect(query).toBeDefined()
      expect(query?.queryKey).toEqual(expectedKey)
    })

    it('should only invalidate affected entity feed, not all activity', async () => {
      const sprintKey = queryKeys.activity.feed('sprint', 'sprint-1')
      const taskKey = queryKeys.activity.feed('task', 'task-123')

      // Set initial data for both feeds
      queryClient.setQueryData(sprintKey, { pages: [], pageParams: [] })
      queryClient.setQueryData(taskKey, { pages: [], pageParams: [] })

      // Verify both are cached
      expect(queryClient.getQueryData(sprintKey)).toBeDefined()
      expect(queryClient.getQueryData(taskKey)).toBeDefined()

      // Invalidate only task feed
      queryClient.invalidateQueries({ queryKey: taskKey })

      // Sprint feed should still be cached
      expect(queryClient.getQueryData(sprintKey)).toBeDefined()

      // Task feed should be invalidated
      expect(queryClient.getQueryData(taskKey)).toBeUndefined()
    })

    it('should not affect other entity feeds when invalidating', () => {
      const sprintKey = queryKeys.activity.feed('sprint', 'sprint-1')
      const agentKey = queryKeys.activity.feed('agent', 'agent-1')

      queryClient.setQueryData(sprintKey, { pages: [], pageParams: [] })
      queryClient.setQueryData(agentKey, { pages: [], pageParams: [] })

      // Invalidate agent feed
      queryClient.invalidateQueries({ queryKey: agentKey })

      // Only agent feed should be affected
      expect(queryClient.getQueryData(agentKey)).toBeUndefined()
      expect(queryClient.getQueryData(sprintKey)).toBeDefined()
    })
  })

  describe('Cursor-Based Pagination', () => {
    it('should support getNextPageParam for cursor pagination', async () => {
      const page1: ActivityFeedResponse = {
        events: [
          {
            id: 'evt-1',
            type: 'task_assigned',
            entityType: 'sprint',
            entityId: 'sprint-1',
            actorName: 'alice',
            payload: {},
            createdAt: new Date().toISOString(),
          },
        ],
        nextCursor: 'base64-cursor',
        hasMore: true,
      }

      global.fetch = vi.fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(page1), { status: 200 })
        )

      const { result } = renderHook(() => useActivityFeed({ sprintId: 'sprint-1', limit: 1 }), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.hasNextPage).toBe(true)
      expect(result.current.data?.pages[0].nextCursor).toBe('base64-cursor')
    })

    it('should pass cursor to next page request', async () => {
      const page1: ActivityFeedResponse = {
        events: [
          {
            id: 'evt-1',
            type: 'task_assigned',
            entityType: 'sprint',
            entityId: 'sprint-1',
            actorName: 'alice',
            payload: {},
            createdAt: new Date().toISOString(),
          },
        ],
        nextCursor: 'base64-cursor-2',
        hasMore: true,
      }

      const page2: ActivityFeedResponse = {
        events: [
          {
            id: 'evt-2',
            type: 'task_status_changed',
            entityType: 'sprint',
            entityId: 'sprint-1',
            actorName: 'bob',
            payload: {},
            createdAt: new Date(Date.now() - 60000).toISOString(),
          },
        ],
        nextCursor: null,
        hasMore: false,
      }

      global.fetch = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(page1), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify(page2), { status: 200 }))

      const { result } = renderHook(() => useActivityFeed({ sprintId: 'sprint-1', limit: 1 }), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      await result.current.fetchNextPage()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })

      // Verify second request includes cursor
      const secondCall = (global.fetch.mock.calls[1][0] as string)
      expect(secondCall).toContain('cursor=base64-cursor-2')
    })
  })

  describe('Entity Filtering', () => {
    it('should accept sprintId as shorthand for entityType=sprint', async () => {
      const mockData: ActivityFeedResponse = {
        events: [],
        nextCursor: null,
        hasMore: false,
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        } as Response)
      )

      renderHook(() => useActivityFeed({ sprintId: 'sprint-123' }), { wrapper })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const url = global.fetch.mock.calls[0][0] as string
      expect(url).toContain('entityType=sprint')
      expect(url).toContain('entityId=sprint-123')
    })

    it('should include entityType in request when specified', async () => {
      const mockData: ActivityFeedResponse = {
        events: [],
        nextCursor: null,
        hasMore: false,
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        } as Response)
      )

      renderHook(() => useActivityFeed({ entityType: 'task', entityId: 'task-456' }), {
        wrapper,
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const url = global.fetch.mock.calls[0][0] as string
      expect(url).toContain('entityType=task')
      expect(url).toContain('entityId=task-456')
    })
  })

  describe('Cache Strategy', () => {
    it('should have 15s staleTime', async () => {
      const mockData: ActivityFeedResponse = {
        events: [],
        nextCursor: null,
        hasMore: false,
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        } as Response)
      )

      renderHook(() => useActivityFeed({ sprintId: 'sprint-1' }), { wrapper })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const query = queryClient.getQueryCache().find({
        queryKey: queryKeys.activity.feed('sprint', 'sprint-1'),
      })

      expect(query?.options.staleTime).toBe(15000) // 15s
    })

    it('should have 2min gcTime', async () => {
      const mockData: ActivityFeedResponse = {
        events: [],
        nextCursor: null,
        hasMore: false,
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        } as Response)
      )

      renderHook(() => useActivityFeed({ sprintId: 'sprint-1' }), { wrapper })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const query = queryClient.getQueryCache().find({
        queryKey: queryKeys.activity.feed('sprint', 'sprint-1'),
      })

      expect(query?.gcTime).toBe(2 * 60 * 1000) // 2 minutes
    })
  })

  describe('Polling and Refetch', () => {
    it('should have 30s polling interval by default', async () => {
      const mockData: ActivityFeedResponse = {
        events: [],
        nextCursor: null,
        hasMore: false,
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        } as Response)
      )

      renderHook(() => useActivityFeed({ sprintId: 'sprint-1' }), { wrapper })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const query = queryClient.getQueryCache().find({
        queryKey: queryKeys.activity.feed('sprint', 'sprint-1'),
      })

      expect(query?.options.refetchInterval).toBe(30000) // 30s
    })

    it('should respect custom polling interval', async () => {
      const mockData: ActivityFeedResponse = {
        events: [],
        nextCursor: null,
        hasMore: false,
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        } as Response)
      )

      renderHook(() => useActivityFeed({ sprintId: 'sprint-1', pollingInterval: 10000 }), {
        wrapper,
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const query = queryClient.getQueryCache().find({
        queryKey: queryKeys.activity.feed('sprint', 'sprint-1'),
      })

      expect(query?.options.refetchInterval).toBe(10000)
    })

    it('should enable refetchOnWindowFocus', async () => {
      const mockData: ActivityFeedResponse = {
        events: [],
        nextCursor: null,
        hasMore: false,
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        } as Response)
      )

      renderHook(() => useActivityFeed({ sprintId: 'sprint-1' }), { wrapper })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const query = queryClient.getQueryCache().find({
        queryKey: queryKeys.activity.feed('sprint', 'sprint-1'),
      })

      expect(query?.options.refetchOnWindowFocus).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        } as Response)
      )

      const { result } = renderHook(() => useActivityFeed({ sprintId: 'sprint-1' }), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })
  })
})
