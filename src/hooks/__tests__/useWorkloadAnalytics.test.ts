import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useWorkloadAnalytics } from '../useWorkloadAnalytics'

describe('useWorkloadAnalytics', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should fetch workload analytics', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => [
          {
            agentId: 'agent-1',
            name: 'Alice',
            activeTasksCount: 5,
            completedTasks: 20,
            averageCompletionTime: 3,
            capacityUtilization: 50,
            skillTags: ['code-review', 'refactoring'],
            completionTrend: 10,
            status: 'busy',
          },
        ],
      })
    )

    const { result } = renderHook(() => useWorkloadAnalytics(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].name).toBe('Alice')
  })

  it('should handle fetch errors', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
      })
    )

    const { result } = renderHook(() => useWorkloadAnalytics(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
