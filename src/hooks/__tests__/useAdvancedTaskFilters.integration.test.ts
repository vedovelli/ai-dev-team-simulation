import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import React from 'react'
import { useAdvancedTaskFilters } from '../useAdvancedTaskFilters'
import type { Task } from '../../types/task'

/**
 * Integration tests for useAdvancedTaskFilters with TanStack Query
 * Tests the complete filtering flow with query integration
 */
describe('useAdvancedTaskFilters Integration with TanStack Query', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    })
  })

  afterEach(() => {
    queryClient.clear()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  // Mock fetch for tasks endpoint
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'High Priority Urgent Task',
      status: 'in-progress',
      priority: 'high',
      assignee: 'agent-1',
      team: 'team-a',
      sprint: 'sprint-1',
      storyPoints: 5,
      order: 1,
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
    },
    {
      id: '2',
      title: 'Medium Priority Review Task',
      status: 'in-review',
      priority: 'medium',
      assignee: 'agent-2',
      team: 'team-a',
      sprint: 'sprint-1',
      storyPoints: 3,
      order: 2,
      createdAt: '2026-01-20T10:00:00Z',
      updatedAt: '2026-01-20T10:00:00Z',
    },
    {
      id: '3',
      title: 'Low Priority Backlog Item',
      status: 'backlog',
      priority: 'low',
      assignee: 'agent-1',
      team: 'team-b',
      sprint: 'sprint-2',
      storyPoints: 2,
      order: 3,
      createdAt: '2026-02-01T10:00:00Z',
      updatedAt: '2026-02-01T10:00:00Z',
    },
    {
      id: '4',
      title: 'Done High Priority Task',
      status: 'done',
      priority: 'high',
      assignee: 'agent-3',
      team: 'team-b',
      sprint: 'sprint-1',
      storyPoints: 8,
      order: 4,
      createdAt: '2026-02-15T10:00:00Z',
      updatedAt: '2026-02-15T10:00:00Z',
    },
  ]

  const mockFetchTasks = async (
    status?: string[],
    priority?: string,
    search?: string,
    assignee?: string,
    dateFrom?: string,
    dateTo?: string,
    pageIndex?: number,
    pageSize?: number
  ) => {
    // Simple in-memory filtering
    let filtered = [...mockTasks]

    if (status && status.length > 0) {
      filtered = filtered.filter((t) => status.includes(t.status))
    }

    if (priority) {
      filtered = filtered.filter((t) => t.priority === priority)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter((t) =>
        t.title.toLowerCase().includes(searchLower)
      )
    }

    if (assignee) {
      filtered = filtered.filter((t) => t.assignee === assignee)
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      filtered = filtered.filter((t) => new Date(t.createdAt) >= fromDate)
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((t) => new Date(t.createdAt) <= toDate)
    }

    // Pagination
    const page = pageIndex || 0
    const size = pageSize || 10
    const start = page * size
    const end = start + size

    return {
      data: filtered.slice(start, end),
      total: filtered.length,
      page: page + 1,
      pageIndex: page,
      pageSize: size,
      totalPages: Math.ceil(filtered.length / size),
    }
  }

  describe('single filter operations', () => {
    it('should filter tasks by single status', async () => {
      const { result: filterResult } = renderHook(
        () => useAdvancedTaskFilters(),
        { wrapper }
      )

      const { result: queryResult } = renderHook(
        () => {
          return useQuery({
            queryKey: filterResult.current.queryKey,
            queryFn: async () => {
              return mockFetchTasks(
                filterResult.current.status.length > 0
                  ? filterResult.current.status
                  : undefined,
                filterResult.current.priority || undefined,
                filterResult.current.debouncedSearch || undefined
              )
            },
          })
        },
        { wrapper }
      )

      act(() => {
        filterResult.current.setStatusFilter(['done'])
      })

      await waitFor(() => {
        expect(queryResult.current.data).toBeDefined()
      })

      expect(queryResult.current.data?.data).toHaveLength(1)
      expect(queryResult.current.data?.data[0]?.id).toBe('4')
    })

    it('should filter tasks by priority', async () => {
      const { result: filterResult } = renderHook(
        () => useAdvancedTaskFilters(),
        { wrapper }
      )

      const { result: queryResult } = renderHook(
        () => {
          return useQuery({
            queryKey: filterResult.current.queryKey,
            queryFn: async () => {
              return mockFetchTasks(
                filterResult.current.status.length > 0
                  ? filterResult.current.status
                  : undefined,
                filterResult.current.priority || undefined
              )
            },
          })
        },
        { wrapper }
      )

      act(() => {
        filterResult.current.setPriorityFilter('high')
      })

      await waitFor(() => {
        expect(queryResult.current.data).toBeDefined()
      })

      expect(queryResult.current.data?.data).toHaveLength(2)
      expect(
        queryResult.current.data?.data.every((t) => t.priority === 'high')
      ).toBe(true)
    })

    it('should filter tasks by assignee', async () => {
      const { result: filterResult } = renderHook(
        () => useAdvancedTaskFilters(),
        { wrapper }
      )

      const { result: queryResult } = renderHook(
        () => {
          return useQuery({
            queryKey: filterResult.current.queryKey,
            queryFn: async () => {
              return mockFetchTasks(
                filterResult.current.status.length > 0
                  ? filterResult.current.status
                  : undefined,
                filterResult.current.priority || undefined,
                filterResult.current.debouncedSearch || undefined,
                filterResult.current.assignee || undefined
              )
            },
          })
        },
        { wrapper }
      )

      act(() => {
        filterResult.current.setAssigneeFilter('agent-1')
      })

      await waitFor(() => {
        expect(queryResult.current.data).toBeDefined()
      })

      expect(queryResult.current.data?.data).toHaveLength(2)
      expect(
        queryResult.current.data?.data.every((t) => t.assignee === 'agent-1')
      ).toBe(true)
    })
  })

  describe('multi-filter operations', () => {
    it('should combine multiple filters with AND logic', async () => {
      const { result: filterResult } = renderHook(
        () => useAdvancedTaskFilters(),
        { wrapper }
      )

      const { result: queryResult } = renderHook(
        () => {
          return useQuery({
            queryKey: filterResult.current.queryKey,
            queryFn: async () => {
              return mockFetchTasks(
                filterResult.current.status.length > 0
                  ? filterResult.current.status
                  : undefined,
                filterResult.current.priority || undefined,
                filterResult.current.debouncedSearch || undefined,
                filterResult.current.assignee || undefined
              )
            },
          })
        },
        { wrapper }
      )

      // Filter: status=in-progress OR in-review, priority=high
      act(() => {
        filterResult.current.setStatusFilter(['in-progress', 'in-review'])
        filterResult.current.setPriorityFilter('high')
      })

      await waitFor(() => {
        expect(queryResult.current.data).toBeDefined()
      })

      // Should only return tasks with (status IN [in-progress, in-review]) AND (priority = high)
      expect(queryResult.current.data?.data).toHaveLength(1)
      expect(queryResult.current.data?.data[0]?.id).toBe('1')
    })
  })

  describe('search filtering with debounce', () => {
    it('should not trigger query until search is debounced', async () => {
      const fetchSpy = vi.fn()

      const { result: filterResult } = renderHook(
        () => useAdvancedTaskFilters({ searchDebounceMs: 300 }),
        { wrapper }
      )

      const { result: queryResult } = renderHook(
        () => {
          return useQuery({
            queryKey: filterResult.current.queryKey,
            queryFn: async () => {
              fetchSpy()
              return mockFetchTasks(
                filterResult.current.status.length > 0
                  ? filterResult.current.status
                  : undefined,
                filterResult.current.priority || undefined,
                filterResult.current.debouncedSearch || undefined
              )
            },
          })
        },
        { wrapper }
      )

      act(() => {
        filterResult.current.setSearchFilter('High')
      })

      // Spy should have been called at least once for initial query
      const initialCallCount = fetchSpy.mock.calls.length

      vi.useFakeTimers()
      act(() => {
        vi.advanceTimersByTime(150)
      })
      vi.useRealTimers()

      // Should not have triggered a new query yet
      expect(fetchSpy.mock.calls.length).toBe(initialCallCount)

      vi.useFakeTimers()
      act(() => {
        vi.advanceTimersByTime(150)
      })
      vi.useRealTimers()

      // Now should have triggered
      await waitFor(() => {
        expect(fetchSpy.mock.calls.length).toBeGreaterThan(initialCallCount)
      })
    })

    it('should search across task titles', async () => {
      const { result: filterResult } = renderHook(
        () => useAdvancedTaskFilters(),
        { wrapper }
      )

      const { result: queryResult } = renderHook(
        () => {
          return useQuery({
            queryKey: filterResult.current.queryKey,
            queryFn: async () => {
              return mockFetchTasks(
                filterResult.current.status.length > 0
                  ? filterResult.current.status
                  : undefined,
                filterResult.current.priority || undefined,
                filterResult.current.debouncedSearch || undefined
              )
            },
          })
        },
        { wrapper }
      )

      vi.useFakeTimers()
      act(() => {
        filterResult.current.setSearchFilter('Priority')
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })
      vi.useRealTimers()

      await waitFor(() => {
        expect(queryResult.current.data).toBeDefined()
      })

      // Should match: 'High Priority Urgent Task', 'Medium Priority Review Task'
      expect(queryResult.current.data?.total).toBe(2)
    })
  })

  describe('date range filtering', () => {
    it('should filter tasks by date range', async () => {
      const { result: filterResult } = renderHook(
        () => useAdvancedTaskFilters(),
        { wrapper }
      )

      const { result: queryResult } = renderHook(
        () => {
          return useQuery({
            queryKey: filterResult.current.queryKey,
            queryFn: async () => {
              return mockFetchTasks(
                filterResult.current.status.length > 0
                  ? filterResult.current.status
                  : undefined,
                filterResult.current.priority || undefined,
                filterResult.current.debouncedSearch || undefined,
                filterResult.current.assignee || undefined,
                filterResult.current.dateFrom || undefined,
                filterResult.current.dateTo || undefined
              )
            },
          })
        },
        { wrapper }
      )

      act(() => {
        filterResult.current.setDateRangeFilter('2026-02-01', '2026-03-01')
      })

      await waitFor(() => {
        expect(queryResult.current.data).toBeDefined()
      })

      expect(queryResult.current.data?.data).toHaveLength(2)
      expect(
        queryResult.current.data?.data.map((t) => t.id).sort()
      ).toEqual(['3', '4'])
    })
  })

  describe('pagination with filters', () => {
    it('should reset to page 1 when filters change', async () => {
      const { result: filterResult } = renderHook(
        () => useAdvancedTaskFilters({ searchDebounceMs: 300 }),
        { wrapper }
      )

      act(() => {
        filterResult.current.setPage(2)
      })

      expect(filterResult.current.page).toBe(2)

      vi.useFakeTimers()
      act(() => {
        filterResult.current.setSearchFilter('test')
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })
      vi.useRealTimers()

      // Page should be reset to 1
      expect(filterResult.current.page).toBe(1)
    })
  })

  describe('query invalidation and refetching', () => {
    it('should generate different query keys for different filter combinations', async () => {
      const { result: filters1 } = renderHook(
        () => useAdvancedTaskFilters(),
        { wrapper }
      )

      const { result: filters2 } = renderHook(
        () => useAdvancedTaskFilters(),
        { wrapper }
      )

      act(() => {
        filters1.current.setPriorityFilter('high')
      })

      act(() => {
        filters2.current.setPriorityFilter('medium')
      })

      expect(filters1.current.queryKey).not.toEqual(filters2.current.queryKey)
    })

    it('should maintain stable query key for same filter combinations', async () => {
      const { result: filters1 } = renderHook(
        () => useAdvancedTaskFilters(),
        { wrapper }
      )

      const { result: filters2 } = renderHook(
        () => useAdvancedTaskFilters(),
        { wrapper }
      )

      act(() => {
        filters1.current.setStatusFilter(['done', 'in-progress'])
        filters1.current.setPriorityFilter('high')
      })

      act(() => {
        filters2.current.setStatusFilter(['in-progress', 'done']) // Different order
        filters2.current.setPriorityFilter('high')
      })

      // Should be equal because status arrays are sorted
      expect(filters1.current.queryKey).toEqual(filters2.current.queryKey)
    })
  })

  describe('filter metadata accuracy', () => {
    it('should accurately report active filter count through query lifecycle', async () => {
      const { result: filterResult } = renderHook(
        () => useAdvancedTaskFilters(),
        { wrapper }
      )

      expect(filterResult.current.activeFilterCount).toBe(0)

      act(() => {
        filterResult.current.setPriorityFilter('high')
      })

      expect(filterResult.current.activeFilterCount).toBe(1)

      act(() => {
        filterResult.current.setStatusFilter(['done', 'in-progress'])
      })

      expect(filterResult.current.activeFilterCount).toBe(3)

      act(() => {
        filterResult.current.setDateRangeFilter('2026-01-01', '2026-01-31')
      })

      expect(filterResult.current.activeFilterCount).toBe(5)
    })
  })
})
