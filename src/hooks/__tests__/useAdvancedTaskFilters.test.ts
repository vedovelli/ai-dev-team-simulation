import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAdvancedTaskFilters } from '../useAdvancedTaskFilters'

describe('useAdvancedTaskFilters', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize with default filter state', () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      expect(result.current.state).toEqual({
        priority: null,
        status: [],
        assignee: null,
        search: '',
        dateFrom: null,
        dateTo: null,
        page: 1,
        pageSize: 10,
      })
    })

    it('should generate proper query key structure', () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      expect(result.current.queryKey).toEqual(
        expect.arrayContaining(['tasks', 'filtered'])
      )
      expect(result.current.queryKey.length).toBe(5) // tasks, filtered, hash, page, pageSize
    })

    it('should have no active filters on initialization', () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      expect(result.current.hasActiveFilters).toBe(false)
      expect(result.current.activeFilterCount).toBe(0)
    })
  })

  describe('priority filtering', () => {
    it('should set priority filter', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setPriorityFilter('high')
      })

      expect(result.current.priority).toBe('high')
      expect(result.current.state.priority).toBe('high')
    })

    it('should clear priority filter', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setPriorityFilter('medium')
      })

      act(() => {
        result.current.setPriorityFilter(null)
      })

      expect(result.current.priority).toBe(null)
      expect(result.current.hasActiveFilters).toBe(false)
    })

    it('should reset pagination when priority changes', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setPage(5)
      })

      expect(result.current.page).toBe(5)

      act(() => {
        result.current.setPriorityFilter('high')
      })

      expect(result.current.page).toBe(1)
    })
  })

  describe('status filtering', () => {
    it('should set multiple status filters', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setStatusFilter(['in-progress', 'done'])
      })

      expect(result.current.status).toEqual(['in-progress', 'done'])
      expect(result.current.activeFilterCount).toBe(2)
    })

    it('should toggle status in filter', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.toggleStatus('in-progress')
      })

      expect(result.current.status).toContain('in-progress')

      act(() => {
        result.current.toggleStatus('in-progress')
      })

      expect(result.current.status).not.toContain('in-progress')
    })

    it('should clear status filter', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setStatusFilter(['backlog', 'in-progress'])
      })

      act(() => {
        result.current.setStatusFilter([])
      })

      expect(result.current.status).toEqual([])
      expect(result.current.hasActiveFilters).toBe(false)
    })
  })

  describe('search filtering with debounce', () => {
    it('should update local search immediately', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setSearchFilter('test query')
      })

      expect(result.current.localSearch).toBe('test query')
      // Debounced search should still be empty
      expect(result.current.debouncedSearch).toBe('')
    })

    it('should debounce search with default delay (300ms)', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setSearchFilter('test')
      })

      // Before debounce completes
      expect(result.current.debouncedSearch).toBe('')

      // Advance timer by 300ms
      act(() => {
        vi.advanceTimersByTime(300)
      })

      // After debounce, search should be updated
      expect(result.current.debouncedSearch).toBe('test')
      expect(result.current.state.search).toBe('test')
    })

    it('should respect custom debounce delay', async () => {
      const { result } = renderHook(() =>
        useAdvancedTaskFilters({ searchDebounceMs: 500 })
      )

      act(() => {
        result.current.setSearchFilter('delayed search')
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      // 300ms is not enough for 500ms debounce
      expect(result.current.debouncedSearch).toBe('')

      act(() => {
        vi.advanceTimersByTime(200)
      })

      // Now 500ms total, should be updated
      expect(result.current.debouncedSearch).toBe('delayed search')
    })

    it('should reset pagination when debounced search changes', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setPage(3)
      })

      act(() => {
        result.current.setSearchFilter('query')
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.page).toBe(1)
    })

    it('should cancel previous debounce on rapid input', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setSearchFilter('first')
        vi.advanceTimersByTime(100)
        result.current.setSearchFilter('second')
        vi.advanceTimersByTime(100)
        result.current.setSearchFilter('third')
      })

      // Debounced value should still be empty
      expect(result.current.debouncedSearch).toBe('')

      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Final value should be used
      expect(result.current.debouncedSearch).toBe('third')
    })
  })

  describe('assignee filtering', () => {
    it('should set assignee filter', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setAssigneeFilter('agent-1')
      })

      expect(result.current.assignee).toBe('agent-1')
    })

    it('should clear assignee filter', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setAssigneeFilter('agent-1')
      })

      act(() => {
        result.current.setAssigneeFilter(null)
      })

      expect(result.current.assignee).toBe(null)
    })
  })

  describe('date range filtering', () => {
    it('should set date range', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      const from = '2026-01-01'
      const to = '2026-01-31'

      act(() => {
        result.current.setDateRangeFilter(from, to)
      })

      expect(result.current.dateFrom).toBe(from)
      expect(result.current.dateTo).toBe(to)
      expect(result.current.activeFilterCount).toBe(2)
    })

    it('should allow partial date range', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setDateRangeFilter('2026-01-01', null)
      })

      expect(result.current.dateFrom).toBe('2026-01-01')
      expect(result.current.dateTo).toBeNull()
    })

    it('should clear date range', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setDateRangeFilter('2026-01-01', '2026-01-31')
      })

      act(() => {
        result.current.setDateRangeFilter(null, null)
      })

      expect(result.current.dateFrom).toBeNull()
      expect(result.current.dateTo).toBeNull()
    })
  })

  describe('pagination', () => {
    it('should set page', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setPage(3)
      })

      expect(result.current.page).toBe(3)
      expect(result.current.state.page).toBe(3)
    })

    it('should set page size', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setPageSize(25)
      })

      expect(result.current.pageSize).toBe(25)
      expect(result.current.state.pageSize).toBe(25)
    })

    it('should generate different query keys for different pages', async () => {
      const { result: result1 } = renderHook(() => useAdvancedTaskFilters())
      const { result: result2 } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result2.current.setPage(2)
      })

      expect(result1.current.queryKey).not.toEqual(result2.current.queryKey)
    })
  })

  describe('filter hash generation', () => {
    it('should generate stable hash for same filters', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setPriorityFilter('high')
        result.current.setAssigneeFilter('agent-1')
      })

      const hash1 = result.current.filterHash

      // Update in different order - status array is sorted
      act(() => {
        result.current.setStatusFilter(['done', 'backlog'])
      })

      const hash2 = result.current.filterHash
      expect(hash2).not.toBe(hash1)

      act(() => {
        result.current.setStatusFilter(['backlog', 'done'])
      })

      const hash3 = result.current.filterHash
      // Should be same because status is sorted
      expect(hash3).toBe(hash2)
    })

    it('should change hash when filters change', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      const initialHash = result.current.filterHash

      act(() => {
        result.current.setPriorityFilter('high')
      })

      expect(result.current.filterHash).not.toBe(initialHash)
    })
  })

  describe('filter metadata', () => {
    it('should track active filter count correctly', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      expect(result.current.activeFilterCount).toBe(0)

      act(() => {
        result.current.setPriorityFilter('high')
      })
      expect(result.current.activeFilterCount).toBe(1)

      act(() => {
        result.current.setStatusFilter(['in-progress', 'done'])
      })
      expect(result.current.activeFilterCount).toBe(3) // priority + 2 statuses

      act(() => {
        result.current.setAssigneeFilter('agent-1')
      })
      expect(result.current.activeFilterCount).toBe(4)
    })

    it('should report has active filters correctly', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      expect(result.current.hasActiveFilters).toBe(false)

      act(() => {
        result.current.setSearchFilter('test')
      })
      // Still false because search is not debounced yet
      expect(result.current.hasActiveFilters).toBe(false)

      act(() => {
        vi.advanceTimersByTime(300)
      })
      // Now it should be true
      expect(result.current.hasActiveFilters).toBe(true)

      act(() => {
        result.current.clearAllFilters()
      })
      expect(result.current.hasActiveFilters).toBe(false)
    })
  })

  describe('clear all filters', () => {
    it('should reset all filters to initial state', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setPriorityFilter('high')
        result.current.setStatusFilter(['in-progress', 'done'])
        result.current.setAssigneeFilter('agent-1')
        result.current.setSearchFilter('test')
        result.current.setDateRangeFilter('2026-01-01', '2026-01-31')
        result.current.setPage(5)
        vi.advanceTimersByTime(300)
      })

      expect(result.current.hasActiveFilters).toBe(true)

      act(() => {
        result.current.clearAllFilters()
      })

      expect(result.current.state).toEqual({
        priority: null,
        status: [],
        assignee: null,
        search: '',
        dateFrom: null,
        dateTo: null,
        page: 1,
        pageSize: 10,
      })
      expect(result.current.hasActiveFilters).toBe(false)
    })
  })

  describe('query options', () => {
    it('should provide query options with defaults', () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      expect(result.current.queryOptions).toEqual({
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        keepPreviousData: true,
        retry: expect.any(Function),
      })
    })

    it('should use custom query options', () => {
      const { result } = renderHook(() =>
        useAdvancedTaskFilters({
          staleTime: 10 * 1000,
          gcTime: 2 * 60 * 1000,
          keepPreviousData: false,
        })
      )

      expect(result.current.queryOptions.staleTime).toBe(10 * 1000)
      expect(result.current.queryOptions.gcTime).toBe(2 * 60 * 1000)
      expect(result.current.queryOptions.keepPreviousData).toBe(false)
    })

    it('should implement exponential backoff retry logic', () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      const retry = result.current.queryOptions.retry

      expect(retry(0)).toBe(true)
      expect(retry(1)).toBe(true)
      expect(retry(2)).toBe(true)
      expect(retry(3)).toBe(false)
    })
  })

  describe('combined filter operations', () => {
    it('should handle complex filter combination', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setPriorityFilter('high')
        result.current.setStatusFilter(['in-progress', 'in-review'])
        result.current.setAssigneeFilter('agent-1')
        result.current.setSearchFilter('urgent')
        result.current.setDateRangeFilter('2026-01-01', '2026-03-08')
        result.current.setPage(2)
        vi.advanceTimersByTime(300)
      })

      const state = result.current.state

      expect(state.priority).toBe('high')
      expect(state.status).toEqual(['in-progress', 'in-review'])
      expect(state.assignee).toBe('agent-1')
      expect(state.search).toBe('urgent')
      expect(state.dateFrom).toBe('2026-01-01')
      expect(state.dateTo).toBe('2026-03-08')
      expect(state.page).toBe(2)

      expect(result.current.activeFilterCount).toBe(7)
      expect(result.current.hasActiveFilters).toBe(true)
    })

    it('should maintain query key stability for same filter combinations', async () => {
      const { result: result1 } = renderHook(() => useAdvancedTaskFilters())
      const { result: result2 } = renderHook(() => useAdvancedTaskFilters())

      // Apply same filters
      act(() => {
        result1.current.setPriorityFilter('high')
        result1.current.setStatusFilter(['done', 'in-progress'])
        result1.current.setAssigneeFilter('agent-1')
      })

      act(() => {
        result2.current.setPriorityFilter('high')
        result2.current.setStatusFilter(['in-progress', 'done']) // Different order
        result2.current.setAssigneeFilter('agent-1')
      })

      // Query keys should be the same (status is sorted)
      expect(result1.current.queryKey).toEqual(result2.current.queryKey)
    })
  })

  describe('reset pagination', () => {
    it('should only reset page without clearing filters', async () => {
      const { result } = renderHook(() => useAdvancedTaskFilters())

      act(() => {
        result.current.setPriorityFilter('high')
        result.current.setAssigneeFilter('agent-1')
        result.current.setPage(5)
      })

      act(() => {
        result.current.resetPagination()
      })

      expect(result.current.page).toBe(1)
      expect(result.current.priority).toBe('high')
      expect(result.current.assignee).toBe('agent-1')
    })
  })
})
