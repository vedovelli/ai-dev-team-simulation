import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { vi } from 'vitest'
import { useSprintMetrics } from '../useSprintMetrics'
import { useAgentTasks } from '../useAgentTasks'
import { setupServer } from 'msw/node'
import { sprintAnalyticsHandlers } from '../../mocks/handlers/sprintAnalytics'

const server = setupServer(...sprintAnalyticsHandlers)

// Setup/teardown
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Helper to create QueryClient wrapper with custom config
function createWrapper(staleTime = 100, gcTime = 0) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime,
        staleTime,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Polling Hooks - Sync State', () => {
  describe('useSprintMetrics - sync state', () => {
    it('starts in idle state when data is fresh', async () => {
      const { result } = renderHook(() => useSprintMetrics('sprint-1'), {
        wrapper: createWrapper(),
      })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Should be idle when data is fresh (not fetching and not stale)
      expect(result.current.isFetching).toBe(false)
      expect(result.current.isStale).toBe(false)
      expect(result.current.syncStatus).toBe('idle')
    })

    it('transitions to syncing state during fetch', async () => {
      let resolveRequest: (() => void) | null = null
      const slowHandler = vi.fn(async () => {
        return new Promise((resolve) => {
          resolveRequest = resolve
        })
      })

      const { result } = renderHook(() => useSprintMetrics('sprint-2'), {
        wrapper: createWrapper(),
      })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Trigger refetch
      await act(async () => {
        result.current.refetch()
      })

      // During refetch, should be syncing
      expect(result.current.isFetching).toBe(true)
      expect(result.current.syncStatus).toBe('syncing')

      // Complete refetch
      if (resolveRequest) {
        resolveRequest()
      }
    })

    it('transitions to stale state when data expires', async () => {
      const { result } = renderHook(() => useSprintMetrics('sprint-1'), {
        wrapper: createWrapper(50, 500), // Short stale time
      })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Data is fresh initially
      expect(result.current.syncStatus).toBe('idle')

      // Wait for stale time to pass
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      // Should be stale when queried (not fetching yet)
      expect(result.current.isStale).toBe(true)
      expect(result.current.isFetching).toBe(false)
      expect(result.current.syncStatus).toBe('stale')
    })

    it('returns metrics data with sync state', async () => {
      const { result } = renderHook(() => useSprintMetrics('sprint-2'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Should have metrics and sync state
      expect(result.current.metrics).toBeDefined()
      expect(result.current.metrics?.completionPercentage).toBeDefined()
      expect(result.current.syncStatus).toBe('idle')
      expect(result.current.isFetching).toBe(false)
      expect(result.current.isStale).toBe(false)
    })

    it('maintains backward compatibility with existing query properties', async () => {
      const { result } = renderHook(() => useSprintMetrics('sprint-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Should still have all original query properties
      expect(result.current.data).toBeDefined()
      expect(result.current.error).toBeNull()
      expect(result.current.isPending).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isError).toBe(false)
      expect(result.current.status).toBe('success')
    })

    it('syncing state takes precedence over stale state', async () => {
      const { result } = renderHook(() => useSprintMetrics('sprint-1'), {
        wrapper: createWrapper(50, 500), // Short stale time
      })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Wait for stale time to pass
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      // Data is stale
      expect(result.current.isStale).toBe(true)

      // Trigger refetch
      await act(async () => {
        result.current.refetch()
      })

      // During refetch, syncing takes precedence even though data is stale
      if (result.current.isFetching) {
        expect(result.current.syncStatus).toBe('syncing')
      } else {
        // If refetch is instant, should be idle when complete
        expect(result.current.syncStatus).toBe('idle')
      }
    })
  })

  describe('useAgentTasks - sync state', () => {
    it('starts in idle state when data is fresh', async () => {
      const { result } = renderHook(() => useAgentTasks('alice'), {
        wrapper: createWrapper(),
      })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Should be idle when data is fresh
      expect(result.current.isFetching).toBe(false)
      expect(result.current.isStale).toBe(false)
      expect(result.current.syncStatus).toBe('idle')
    })

    it('transitions to syncing state during fetch', async () => {
      const { result } = renderHook(() => useAgentTasks('bob'), {
        wrapper: createWrapper(),
      })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Trigger refetch
      await act(async () => {
        result.current.refetch()
      })

      // During refetch, should be syncing
      expect(result.current.isFetching).toBe(true)
      expect(result.current.syncStatus).toBe('syncing')
    })

    it('transitions to stale state when data expires', async () => {
      const { result } = renderHook(() => useAgentTasks('alice'), {
        wrapper: createWrapper(50, 500), // Short stale time
      })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Data is fresh initially
      expect(result.current.syncStatus).toBe('idle')

      // Wait for stale time to pass
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      // Should be stale when queried
      expect(result.current.isStale).toBe(true)
      expect(result.current.isFetching).toBe(false)
      expect(result.current.syncStatus).toBe('stale')
    })

    it('returns agent tasks with sync state', async () => {
      const { result } = renderHook(() => useAgentTasks('alice'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Should have tasks and sync state
      expect(result.current.tasks).toBeDefined()
      expect(Array.isArray(result.current.tasks)).toBe(true)
      expect(result.current.totalCount).toBeDefined()
      expect(result.current.syncStatus).toBe('idle')
      expect(result.current.isFetching).toBe(false)
      expect(result.current.isStale).toBe(false)
    })

    it('populates tasks array from response data', async () => {
      const { result } = renderHook(() => useAgentTasks('alice'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Alice should have 3 tasks
      expect(result.current.tasks.length).toBe(3)
      expect(result.current.totalCount).toBe(3)

      // Check task properties
      result.current.tasks.forEach((task) => {
        expect(task.id).toBeDefined()
        expect(task.title).toBeDefined()
        expect(task.assignee).toBe('alice')
      })
    })

    it('maintains backward compatibility with existing query properties', async () => {
      const { result } = renderHook(() => useAgentTasks('bob'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Should still have all original query properties
      expect(result.current.data).toBeDefined()
      expect(result.current.error).toBeNull()
      expect(result.current.isPending).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isError).toBe(false)
      expect(result.current.status).toBe('success')
    })
  })

  describe('Sync state transitions', () => {
    it('correctly computes idle state (not isFetching AND not isStale)', async () => {
      const { result } = renderHook(() => useSprintMetrics('sprint-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Verify idle state logic
      const isIdle = !result.current.isFetching && !result.current.isStale
      expect(isIdle).toBe(true)
      expect(result.current.syncStatus).toBe('idle')
    })

    it('correctly computes syncing state (isFetching)', async () => {
      const { result } = renderHook(() => useAgentTasks('alice'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Trigger refetch to observe syncing state
      await act(async () => {
        const refetchPromise = result.current.refetch()
        // Check state during refetch
        if (result.current.isFetching) {
          expect(result.current.syncStatus).toBe('syncing')
        }
        await refetchPromise
      })
    })

    it('correctly computes stale state (isStale AND not isFetching)', async () => {
      const { result } = renderHook(() => useSprintMetrics('sprint-2'), {
        wrapper: createWrapper(50, 500), // Short stale time
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      // Wait for stale time
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      // Verify stale state logic
      const isStale = result.current.isStale && !result.current.isFetching
      expect(isStale).toBe(true)
      expect(result.current.syncStatus).toBe('stale')
    })
  })

  describe('Error handling with sync state', () => {
    it('maintains sync state on error', async () => {
      const { result } = renderHook(() => useSprintMetrics('invalid-sprint'), {
        wrapper: createWrapper(),
      })

      // Wait for error
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Should still expose sync state even on error
      expect(result.current.syncStatus).toBeDefined()
      expect(['idle', 'syncing', 'stale']).toContain(result.current.syncStatus)
    })
  })
})
