import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { detectCircularDependency, useDependencyMutations } from '../mutations/useDependencyMutations'
import type { Task } from '../../types/task'
import React from 'react'

describe('detectCircularDependency', () => {
  it('should detect direct self-dependency', () => {
    const tasks = new Map<string, Task>([
      ['task-1', { id: 'task-1', dependsOn: [] } as Task],
    ])

    const error = detectCircularDependency('task-1', 'task-1', tasks)
    expect(error).toBe('A task cannot depend on itself')
  })

  it('should detect circular dependency in a chain', () => {
    // task-1 -> task-2 -> task-3
    // If we try to make task-3 -> task-1, that creates a cycle
    const tasks = new Map<string, Task>([
      ['task-1', { id: 'task-1', dependsOn: ['task-2'] } as Task],
      ['task-2', { id: 'task-2', dependsOn: ['task-3'] } as Task],
      ['task-3', { id: 'task-3', dependsOn: [] } as Task],
    ])

    const error = detectCircularDependency('task-1', 'task-3', tasks)
    expect(error).not.toBeNull()
    expect(error).toContain('circular')
  })

  it('should allow valid dependencies', () => {
    // task-1 -> task-2
    // task-3 is independent
    // task-4 can depend on task-1 without issues
    const tasks = new Map<string, Task>([
      ['task-1', { id: 'task-1', dependsOn: ['task-2'] } as Task],
      ['task-2', { id: 'task-2', dependsOn: [] } as Task],
      ['task-3', { id: 'task-3', dependsOn: [] } as Task],
      ['task-4', { id: 'task-4', dependsOn: [] } as Task],
    ])

    const error = detectCircularDependency('task-4', 'task-1', tasks)
    expect(error).toBeNull()
  })

  it('should detect circular dependency in longer chains', () => {
    // task-1 -> task-2 -> task-3 -> task-4
    // If we try to make task-1 -> task-4, that creates a cycle
    const tasks = new Map<string, Task>([
      ['task-1', { id: 'task-1', dependsOn: ['task-2'] } as Task],
      ['task-2', { id: 'task-2', dependsOn: ['task-3'] } as Task],
      ['task-3', { id: 'task-3', dependsOn: ['task-4'] } as Task],
      ['task-4', { id: 'task-4', dependsOn: [] } as Task],
    ])

    const error = detectCircularDependency('task-1', 'task-4', tasks)
    expect(error).not.toBeNull()
    expect(error).toContain('circular')
  })

  it('should allow dependencies that do not create cycles', () => {
    // task-1 -> task-2 -> task-3
    // task-4 -> task-5
    // task-4 can depend on task-3 without creating a cycle
    const tasks = new Map<string, Task>([
      ['task-1', { id: 'task-1', dependsOn: ['task-2'] } as Task],
      ['task-2', { id: 'task-2', dependsOn: ['task-3'] } as Task],
      ['task-3', { id: 'task-3', dependsOn: [] } as Task],
      ['task-4', { id: 'task-4', dependsOn: ['task-5'] } as Task],
      ['task-5', { id: 'task-5', dependsOn: [] } as Task],
    ])

    const error = detectCircularDependency('task-4', 'task-3', tasks)
    expect(error).toBeNull()
  })

  it('should handle missing tasks gracefully', () => {
    const tasks = new Map<string, Task>()

    // Should return null since task-2 doesn't exist (can't detect cycle with missing data)
    const error = detectCircularDependency('task-1', 'task-2', tasks)
    expect(error).toBeNull()
  })

  it('should detect two-way circular dependency', () => {
    // task-1 -> task-2 and task-2 -> task-1 (mutual dependency)
    const tasks = new Map<string, Task>([
      ['task-1', { id: 'task-1', dependsOn: ['task-2'] } as Task],
      ['task-2', { id: 'task-2', dependsOn: ['task-1'] } as Task],
    ])

    const error = detectCircularDependency('task-2', 'task-1', tasks)
    expect(error).not.toBeNull()
    expect(error).toContain('circular')
  })

  it('should handle empty dependency chains', () => {
    const tasks = new Map<string, Task>([
      ['task-1', { id: 'task-1', dependsOn: undefined } as Task],
      ['task-2', { id: 'task-2', dependsOn: [] } as Task],
    ])

    const error = detectCircularDependency('task-1', 'task-2', tasks)
    expect(error).toBeNull()
  })
})

describe('useDependencyMutations hook', () => {
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

  function renderHookWithProvider() {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    return renderHook(() => useDependencyMutations(), { wrapper })
  }

  it('should add a dependency successfully', async () => {
    const mockTask = {
      id: 'task-1',
      dependsOn: ['task-2'],
      updatedAt: new Date().toISOString(),
    } as Task

    vi.global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(mockTask)))
    )

    // Set up initial task data in query cache
    const tasks: Task[] = [
      { id: 'task-1', dependsOn: [] } as Task,
      { id: 'task-2', dependsOn: [] } as Task,
    ]
    queryClient.setQueryData(['tasks'], tasks)

    const { result } = renderHookWithProvider()

    await act(async () => {
      result.current.addDependency({
        taskId: 'task-1',
        dependsOnTaskId: 'task-2',
      })
    })

    await waitFor(() => {
      expect(vi.global.fetch).toHaveBeenCalledWith(
        '/api/tasks/task-1/dependencies',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ dependsOnTaskId: 'task-2' }),
        })
      )
    })
  })

  it('should remove a dependency successfully', async () => {
    const mockTask = {
      id: 'task-1',
      dependsOn: [],
      updatedAt: new Date().toISOString(),
    } as Task

    vi.global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(mockTask)))
    )

    // Set up initial task data
    const tasks: Task[] = [
      { id: 'task-1', dependsOn: ['task-2'] } as Task,
      { id: 'task-2', dependsOn: [] } as Task,
    ]
    queryClient.setQueryData(['tasks'], tasks)

    const { result } = renderHookWithProvider()

    await act(async () => {
      result.current.removeDependency({
        taskId: 'task-1',
        dependsOnTaskId: 'task-2',
      })
    })

    await waitFor(() => {
      expect(vi.global.fetch).toHaveBeenCalledWith(
        '/api/tasks/task-1/dependencies/task-2',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  it('should handle circular dependency error', async () => {
    vi.global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: false }), { status: 400 }))
    )

    // Set up circular dependency scenario
    const tasks: Task[] = [
      { id: 'task-1', dependsOn: ['task-2'] } as Task,
      { id: 'task-2', dependsOn: ['task-1'] } as Task,
    ]
    queryClient.setQueryData(['tasks'], tasks)

    const { result } = renderHookWithProvider()
    const onError = vi.fn()

    await act(async () => {
      result.current.addDependency(
        {
          taskId: 'task-2',
          dependsOnTaskId: 'task-1',
        },
        { onError }
      )
    })

    await waitFor(() => {
      expect(onError).toHaveBeenCalled()
      const error = onError.mock.calls[0][0]
      expect(error.message).toContain('circular')
    })
  })

  it('should invalidate dependency cache on successful mutation', async () => {
    const mockTask = {
      id: 'task-1',
      dependsOn: ['task-2'],
      updatedAt: new Date().toISOString(),
    } as Task

    vi.global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(mockTask)))
    )

    const tasks: Task[] = [
      { id: 'task-1', dependsOn: [] } as Task,
      { id: 'task-2', dependsOn: [] } as Task,
    ]
    queryClient.setQueryData(['tasks'], tasks)

    // Set up some dependency cache
    queryClient.setQueryData(['dependencies', 'list', 'task-1'], {
      taskId: 'task-1',
      dependencies: [],
      blockers: [],
    })

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHookWithProvider()

    await act(async () => {
      result.current.addDependency({
        taskId: 'task-1',
        dependsOnTaskId: 'task-2',
      })
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['dependencies'],
      })
    })
  })

  it('should track loading state correctly', async () => {
    let resolveResponse: (value: Task) => void

    const responsePromise = new Promise<Task>((resolve) => {
      resolveResponse = resolve
    })

    vi.global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(responsePromise.then((t) => JSON.stringify(t)))
      )
    )

    const tasks: Task[] = [
      { id: 'task-1', dependsOn: [] } as Task,
      { id: 'task-2', dependsOn: [] } as Task,
    ]
    queryClient.setQueryData(['tasks'], tasks)

    const { result } = renderHookWithProvider()

    expect(result.current.isPending).toBe(false)

    await act(async () => {
      result.current.addDependency({
        taskId: 'task-1',
        dependsOnTaskId: 'task-2',
      })
    })

    expect(result.current.isPending).toBe(true)

    await act(async () => {
      resolveResponse!({
        id: 'task-1',
        dependsOn: ['task-2'],
        updatedAt: new Date().toISOString(),
      } as Task)
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })

  it('should throw error when task data is not in cache', async () => {
    const { result } = renderHookWithProvider()
    const onError = vi.fn()

    // Don't set any task data in cache
    await act(async () => {
      result.current.addDependency(
        {
          taskId: 'task-1',
          dependsOnTaskId: 'task-2',
        },
        { onError }
      )
    })

    await waitFor(() => {
      expect(onError).toHaveBeenCalled()
      const error = onError.mock.calls[0][0]
      expect(error.message).toContain('not available in cache')
    })
  })
})
