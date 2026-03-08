import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAddReaction } from '../useAddReaction'
import type { ActivityEvent } from '../../types/activity'
import React from 'react'

describe('useAddReaction', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    // Set up initial activity feed data
    const initialEvents: ActivityEvent[] = [
      {
        id: 'evt-1',
        type: 'task_created',
        actor: 'alice',
        timestamp: new Date().toISOString(),
        metadata: { title: 'Test task' },
        reactions: { '👍': 1 },
      },
    ]
    queryClient.setQueryData(['activity', 'feed'], initialEvents)
  })

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  describe('optimistic updates', () => {
    it('should optimistically update reaction count', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { id: 'evt-1' } }),
        } as Response)
      )

      const { result } = renderHook(() => useAddReaction({ eventId: 'evt-1' }), {
        wrapper,
      })

      // Get initial state
      let feedData = queryClient.getQueryData<ActivityEvent[]>([
        'activity',
        'feed',
      ])
      expect(feedData?.[0].reactions?.['👍']).toBe(1)

      // Mutate
      await act(async () => {
        result.current.mutate('👍')
      })

      // Optimistic update should increase count
      feedData = queryClient.getQueryData<ActivityEvent[]>(['activity', 'feed'])
      expect(feedData?.[0].reactions?.['👍']).toBe(2)
    })

    it('should add new reaction emoji if not present', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { id: 'evt-1' } }),
        } as Response)
      )

      const { result } = renderHook(() => useAddReaction({ eventId: 'evt-1' }), {
        wrapper,
      })

      await act(async () => {
        result.current.mutate('❤️')
      })

      const feedData = queryClient.getQueryData<ActivityEvent[]>([
        'activity',
        'feed',
      ])
      expect(feedData?.[0].reactions?.['❤️']).toBe(1)
      expect(feedData?.[0].reactions?.['👍']).toBe(1) // Previous should still exist
    })
  })

  describe('error handling', () => {
    it('should rollback optimistic update on error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
        } as Response)
      )

      const { result } = renderHook(() => useAddReaction({ eventId: 'evt-1' }), {
        wrapper,
      })

      const initialData = queryClient.getQueryData(['activity', 'feed'])

      await act(async () => {
        result.current.mutate('👍')
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Should revert to previous state
      const feedData = queryClient.getQueryData(['activity', 'feed'])
      expect(feedData).toEqual(initialData)
    })
  })

  describe('api interaction', () => {
    it('should make POST request to correct endpoint', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { id: 'evt-1' } }),
        } as Response)
      )

      const { result } = renderHook(() => useAddReaction({ eventId: 'evt-1' }), {
        wrapper,
      })

      await act(async () => {
        result.current.mutate('🚀')
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/activity/evt-1/reactions',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji: '🚀' }),
        })
      )
    })
  })
})
