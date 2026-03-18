# useTaskFilters Hook — Implementation Guide

## Overview

The `useTaskFilters` hook provides simple, component-state task filtering without URL persistence. It's designed for scenarios where you want local filter management without sharing filter state through the URL.

## Hook API

```typescript
const { filters, setFilter, clearFilters, activeFilterCount } = useTaskFilters()
```

### Return Type

```typescript
interface UseTaskFiltersReturn {
  filters: TaskFilters
  setFilter: (key: keyof TaskFilters, value: string | null) => void
  clearFilters: () => void
  activeFilterCount: number
}
```

### TaskFilters

```typescript
interface TaskFilters {
  agent: string | null      // Agent/assignee ID
  priority: TaskPriority | null  // 'low' | 'medium' | 'high'
  status: TaskStatus | null  // 'backlog' | 'in-progress' | 'in-review' | 'done'
}
```

## Basic Usage

### Simple Filter Panel Component

```typescript
import { useTaskFilters } from '../hooks'
import { useQuery } from '@tanstack/react-query'

export function TaskFilterPanel() {
  const { filters, setFilter, clearFilters, activeFilterCount } = useTaskFilters()

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.agent) params.append('agent', filters.agent)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.status) params.append('status', filters.status)

      const response = await fetch(`/api/tasks?${params}`)
      return response.json()
    },
  })

  return (
    <div className="filter-panel">
      {/* Agent Filter */}
      <select
        value={filters.agent || ''}
        onChange={(e) => setFilter('agent', e.target.value || null)}
      >
        <option value="">All Agents</option>
        <option value="agent-1">Agent 1</option>
        <option value="agent-2">Agent 2</option>
      </select>

      {/* Priority Filter */}
      <select
        value={filters.priority || ''}
        onChange={(e) => setFilter('priority', e.target.value as TaskPriority | null)}
      >
        <option value="">All Priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {/* Status Filter */}
      <select
        value={filters.status || ''}
        onChange={(e) => setFilter('status', e.target.value as TaskStatus | null)}
      >
        <option value="">All Statuses</option>
        <option value="backlog">Backlog</option>
        <option value="in-progress">In Progress</option>
        <option value="in-review">In Review</option>
        <option value="done">Done</option>
      </select>

      {/* Active Filter Count */}
      {activeFilterCount > 0 && (
        <span className="badge">{activeFilterCount} active</span>
      )}

      {/* Clear Button */}
      <button onClick={clearFilters} disabled={activeFilterCount === 0}>
        Clear Filters
      </button>

      {/* Results */}
      {isLoading && <p>Loading...</p>}
      {tasks && <TaskList tasks={tasks} />}
    </div>
  )
}
```

## MSW Handler Integration

The MSW handler for `GET /api/tasks` automatically supports the simple filters through query parameters:

- `?agent=agent-1` — Filter by agent/assignee
- `?priority=high` — Filter by priority
- `?status=in-progress` — Filter by status
- `?agent=agent-1&priority=high&status=in-progress` — Combined filters (AND logic)

All non-null filters must match for a task to be included in results.

## Advanced Usage with Custom Hook

Create a custom hook to encapsulate the filter + query logic:

```typescript
import { useQuery } from '@tanstack/react-query'
import { useTaskFilters } from '../hooks'
import type { Task, PaginatedTasksResponse } from '../types/task'

export function useFilteredTasks() {
  const { filters, setFilter, clearFilters, activeFilterCount } = useTaskFilters()

  const query = useQuery<PaginatedTasksResponse>({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.agent) params.append('agent', filters.agent)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.status) params.append('status', filters.status)

      const response = await fetch(`/api/tasks?${params}`)
      if (!response.ok) throw new Error('Failed to fetch tasks')
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    // Query state
    tasks: query.data?.data ?? [],
    totalCount: query.data?.totalCount ?? 0,
    isLoading: query.isLoading,
    error: query.error,

    // Filter state & methods
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
  }
}
```

Usage:

```typescript
export function TaskBoard() {
  const { tasks, filters, setFilter, clearFilters, isLoading } = useFilteredTasks()

  return (
    <div>
      <TaskFilterBar
        filters={filters}
        setFilter={setFilter}
        clearFilters={clearFilters}
      />
      <TaskGrid tasks={tasks} isLoading={isLoading} />
    </div>
  )
}
```

## Filter Logic

Filters use **AND logic** across dimensions:

- If `agent` is set, task must have matching agent
- AND if `priority` is set, task must have matching priority
- AND if `status` is set, task must have matching status

Example:
- `?agent=agent-1&priority=high` → Returns high-priority tasks assigned to agent-1
- `?status=in-progress` → Returns all in-progress tasks regardless of agent/priority

## When to Use

✅ Use `useTaskFilters` when:
- You want simple component-state filtering
- Filter state doesn't need to be shareable via URL
- You're building a filter UI within a modal or panel
- You don't need filter persistence across navigation

❌ Don't use when:
- You need bookmarkable filtered views
- You want to persist filters across page navigation
- You need complex filter logic with presets
- → Use the advanced `useTaskFilters` from URL-based filtering instead

## Testing

```typescript
import { renderHook, act } from '@testing-library/react'
import { useTaskFilters } from '../hooks'

describe('useTaskFilters', () => {
  it('should initialize with null filters', () => {
    const { result } = renderHook(() => useTaskFilters())
    expect(result.current.filters).toEqual({
      agent: null,
      priority: null,
      status: null,
    })
    expect(result.current.activeFilterCount).toBe(0)
  })

  it('should update filter value', () => {
    const { result } = renderHook(() => useTaskFilters())
    act(() => {
      result.current.setFilter('agent', 'agent-1')
    })
    expect(result.current.filters.agent).toBe('agent-1')
    expect(result.current.activeFilterCount).toBe(1)
  })

  it('should clear all filters', () => {
    const { result } = renderHook(() => useTaskFilters())
    act(() => {
      result.current.setFilter('agent', 'agent-1')
      result.current.setFilter('priority', 'high')
    })
    expect(result.current.activeFilterCount).toBe(2)

    act(() => {
      result.current.clearFilters()
    })
    expect(result.current.filters).toEqual({
      agent: null,
      priority: null,
      status: null,
    })
    expect(result.current.activeFilterCount).toBe(0)
  })
})
```
