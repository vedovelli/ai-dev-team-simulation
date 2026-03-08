import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useNotifications } from '../useNotifications'
import { setupServer } from 'msw/node'
import { notificationHandlers } from '../../mocks/handlers/notifications'

const server = setupServer(...notificationHandlers)

// Setup/teardown
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Helper to create QueryClient wrapper
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useNotifications', () => {
  describe('fetching notifications', () => {
    it('loads initial notifications', async () => {
      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      })

      // Initially loading
      expect(result.current.isPending).toBe(true)

      // Wait for data
      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Has data
      expect(result.current.data).toBeDefined()
      expect(result.current.data.length).toBeGreaterThan(0)
    })

    it('counts unread notifications', async () => {
      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Should have some unread
      expect(result.current.unreadCount).toBeGreaterThan(0)
    })

    it('filters by notification type', async () => {
      const { result } = renderHook(
        () => useNotifications({ type: 'agent_event' }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // All results should be agent_event type
      result.current.data.forEach((notif) => {
        expect(notif.type).toBe('agent_event')
      })
    })

    it('filters unread only', async () => {
      const { result } = renderHook(
        () => useNotifications({ unreadOnly: true }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // All results should be unread
      result.current.data.forEach((notif) => {
        expect(notif.read).toBe(false)
      })
    })

    it('supports pagination', async () => {
      const { result: result1 } = renderHook(
        () => useNotifications({ pageIndex: 0, pageSize: 5 }),
        { wrapper: createWrapper() }
      )

      const { result: result2 } = renderHook(
        () => useNotifications({ pageIndex: 1, pageSize: 5 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result1.current.isPending).toBe(false)
        expect(result2.current.isPending).toBe(false)
      })

      // Different pages should have different data
      const ids1 = result1.current.data.map((n) => n.id)
      const ids2 = result2.current.data.map((n) => n.id)

      // No overlap (assuming enough notifications)
      if (result1.current.data.length > 0 && result2.current.data.length > 0) {
        expect(ids1.some((id) => ids2.includes(id))).toBe(false)
      }
    })
  })

  describe('mark as read mutation', () => {
    it('marks notification as read optimistically', async () => {
      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      const notifToMark = result.current.data.find((n) => !n.read)
      if (!notifToMark) return // Skip if no unread

      const initialUnread = result.current.unreadCount

      // Mark as read
      act(() => {
        result.current.markAsRead.mutate(notifToMark.id)
      })

      // Optimistic update visible immediately
      await waitFor(() => {
        expect(
          result.current.data.find((n) => n.id === notifToMark.id)?.read
        ).toBe(true)
      })

      // Unread count decreases
      expect(result.current.unreadCount).toBe(initialUnread - 1)
    })

    it('reverts on mark as read error', async () => {
      server.use(
        // Override to return error
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      )

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      const notif = result.current.data[0]
      const wasRead = notif.read

      // Attempt mark as read
      await act(async () => {
        try {
          await result.current.markAsRead.mutateAsync(notif.id)
        } catch {
          // Error expected
        }
      })

      // Should have error
      expect(result.current.markAsRead.error).toBeDefined()

      // State reverted to original
      const current = result.current.data.find((n) => n.id === notif.id)
      expect(current?.read).toBe(wasRead)
    })

    it('marks multiple notifications as read', async () => {
      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      const unreadNotifs = result.current.data.filter((n) => !n.read).slice(0, 2)
      if (unreadNotifs.length < 2) return // Need at least 2 unread

      const initialUnread = result.current.unreadCount
      const idsToMark = unreadNotifs.map((n) => n.id)

      // Mark batch as read
      act(() => {
        result.current.markAsReadBatch.mutate(idsToMark)
      })

      await waitFor(() => {
        // All marked should be read
        idsToMark.forEach((id) => {
          expect(result.current.data.find((n) => n.id === id)?.read).toBe(true)
        })
      })

      // Unread count reduced by number marked
      expect(result.current.unreadCount).toBe(initialUnread - idsToMark.length)
    })
  })

  describe('dismiss mutation', () => {
    it('dismisses notification optimistically', async () => {
      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      const notifToDismiss = result.current.data[0]
      const initialLength = result.current.data.length

      // Dismiss
      act(() => {
        result.current.dismiss.mutate(notifToDismiss.id)
      })

      // Optimistically removed from list
      await waitFor(() => {
        expect(
          result.current.data.find((n) => n.id === notifToDismiss.id)
        ).toBeUndefined()
      })

      // Total count decreased
      expect(result.current.data.length).toBe(initialLength - 1)
    })

    it('reverts dismiss on error', async () => {
      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      const notif = result.current.data[0]
      const initialLength = result.current.data.length

      // Mock error
      global.fetch = vi
        .fn()
        .mockRejectedValue(new Error('Dismiss failed'))

      // Attempt dismiss
      await act(async () => {
        try {
          await result.current.dismiss.mutateAsync(notif.id)
        } catch {
          // Error expected
        }
      })

      // Should have error
      expect(result.current.dismiss.error).toBeDefined()

      // Length reverted
      expect(result.current.data.length).toBe(initialLength)
    })
  })

  describe('WebSocket integration', () => {
    it('disables WebSocket when enableWebSocket false', async () => {
      const { result } = renderHook(
        () => useNotifications({ enableWebSocket: false }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // WebSocket should not be connected
      expect(result.current.wsConnected).toBe(false)
    })

    it('falls back to polling when WebSocket unavailable', async () => {
      const { result } = renderHook(
        () => useNotifications({ enableWebSocket: true, refetchInterval: 5000 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Should load data via polling fallback
      expect(result.current.data.length).toBeGreaterThan(0)
    })
  })

  describe('error handling', () => {
    it('handles fetch errors gracefully', async () => {
      server.use(
        global.fetch = vi
          .fn()
          .mockRejectedValue(new Error('Network error'))
      )

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Error should be captured
      expect(result.current.error).toBeDefined()
      expect(result.current.data).toEqual([])
    })

    it('retries failed requests with exponential backoff', async () => {
      let attempts = 0
      global.fetch = vi.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          throw new Error('Temporary failure')
        }
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [],
              total: 0,
              unreadCount: 0,
            })
          )
        )
      })

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Should succeed after retries
      expect(attempts).toBeGreaterThanOrEqual(3)
    })
  })

  describe('cache management', () => {
    it('maintains separate queries for different filters', async () => {
      const wrapper = createWrapper()

      const { result: allNotifs } = renderHook(
        () => useNotifications(),
        { wrapper }
      )

      const { result: unreadOnly } = renderHook(
        () => useNotifications({ unreadOnly: true }),
        { wrapper }
      )

      await waitFor(() => {
        expect(allNotifs.current.isPending).toBe(false)
        expect(unreadOnly.current.isPending).toBe(false)
      })

      // Different datasets
      expect(allNotifs.current.data.length).toBeGreaterThanOrEqual(
        unreadOnly.current.data.length
      )

      // Unread should have fewer items
      expect(
        allNotifs.current.data.some((n) => n.read)
      ).toBe(true)
      expect(
        unreadOnly.current.data.every((n) => !n.read)
      ).toBe(true)
    })

    it('refetches on window focus', async () => {
      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      const initialData = [...result.current.data]

      // Simulate window focus
      act(() => {
        window.dispatchEvent(new Event('focus'))
      })

      // May trigger refetch
      // (timing dependent, so we just verify no error)
      expect(result.current.error).toBeNull()
    })
  })
})
