/**
 * Advanced Data Fetching with TanStack Query + MSW Fixtures
 *
 * This example demonstrates:
 * - Query key factory pattern for cache management
 * - Advanced query hook with proper typing
 * - Advanced mutation hook with cache invalidation
 * - Error handling and loading states
 * - Optimistic updates
 */

import React, { useState } from 'react'
import type { Task, UpdateTaskInput } from '../types/task'
import { useAdvancedQuery, useDetailQuery } from '../hooks/useAdvancedQuery'
import {
  useAdvancedMutation,
  useUpdateMutation,
  useDeleteMutation,
} from '../hooks/useAdvancedMutation'
import { queryKeys } from '../lib/queryKeys'

/**
 * Fetch tasks from the API
 */
async function fetchTasks(filters?: { status?: string }): Promise<Task[]> {
  const url = new URL('/api/tasks', window.location.origin)
  if (filters?.status) {
    url.searchParams.set('status', filters.status)
  }

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error('Failed to fetch tasks')
  }
  const result = await response.json()
  return result.data || []
}

/**
 * Fetch a single task by ID
 */
async function fetchTask(id: string): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch task ${id}`)
  }
  const result = await response.json()
  return result.data
}

/**
 * Update a task
 */
async function updateTaskAPI(id: string, data: UpdateTaskInput): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error(`Failed to update task ${id}`)
  }
  const result = await response.json()
  return result.data
}

/**
 * Delete a task
 */
async function deleteTaskAPI(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`Failed to delete task ${id}`)
  }
  return response.json()
}

/**
 * Create a new task
 */
async function createTaskAPI(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create task')
  }
  const result = await response.json()
  return result.data
}

/**
 * Query Example - List of tasks with filtering
 */
export function AdvancedQueryExample() {
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: tasks, isLoading, error, isFetching } = useAdvancedQuery({
    queryKey: queryKeys.tasks.list({ status: statusFilter || undefined }),
    queryFn: () => fetchTasks(statusFilter ? { status: statusFilter } : undefined),
    onSuccess: (data) => {
      console.log('Tasks loaded successfully:', data.length)
    },
    onError: (error) => {
      console.error('Error loading tasks:', error.message)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Loading tasks...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">Error</p>
        <p className="text-sm">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Tasks Query Example</h2>

      <div className="mb-6 flex items-center gap-2">
        <label className="font-medium">Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded bg-white"
        >
          <option value="">All</option>
          <option value="backlog">Backlog</option>
          <option value="in-progress">In Progress</option>
          <option value="in-review">In Review</option>
          <option value="done">Done</option>
        </select>
        {isFetching && <p className="text-sm text-gray-500">Updating...</p>}
      </div>

      <div className="space-y-2">
        {tasks?.map((task) => (
          <div key={task.id} className="p-3 border rounded bg-white hover:bg-gray-50">
            <div className="font-semibold">{task.title}</div>
            <div className="text-sm text-gray-600">
              Status: {task.status} | Priority: {task.priority}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Mutation Example - Update a task with optimistic updates
 */
export function AdvancedMutationExample({ taskId = 'task-1' }: { taskId?: string }) {
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<'backlog' | 'in-progress' | 'in-review' | 'done'>('backlog')

  // Fetch the task details
  const { data: task, isLoading: isLoadingTask } = useDetailQuery({
    queryKey: queryKeys.tasks.detail(taskId),
    queryFn: () => fetchTask(taskId),
  })

  // Mutation for updating the task
  const { mutate: updateTask, isPending: isUpdating, error: updateError } = useUpdateMutation({
    mutationFn: (data) => updateTaskAPI(taskId, data),
    invalidateQueries: queryKeys.tasks.all,
    onSuccess: (updatedTask) => {
      console.log('Task updated:', updatedTask)
      setTitle('')
      setStatus('backlog')
    },
  })

  // Mutation for deleting the task
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteMutation({
    mutationFn: () => deleteTaskAPI(taskId),
    invalidateQueries: queryKeys.tasks.all,
    onSuccess: () => {
      console.log('Task deleted successfully')
    },
  })

  if (isLoadingTask) {
    return <div className="p-4">Loading task...</div>
  }

  if (!task) {
    return <div className="p-4">Task not found</div>
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Task Mutation Example</h2>

      <div className="bg-gray-50 border rounded p-4 mb-6">
        <h3 className="font-bold mb-2">Current Task</h3>
        <p className="mb-1">
          <strong>Title:</strong> {task.title}
        </p>
        <p>
          <strong>Status:</strong> {task.status}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          const updates: UpdateTaskInput = {}
          if (title) updates.title = title
          if (status) updates.status = status
          updateTask(updates)
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">New Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="Enter new title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="backlog">Backlog</option>
            <option value="in-progress">In Progress</option>
            <option value="in-review">In Review</option>
            <option value="done">Done</option>
          </select>
        </div>

        {updateError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
            {updateError.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isUpdating}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isUpdating ? 'Updating...' : 'Update Task'}
        </button>

        <button
          type="button"
          onClick={() => deleteTask()}
          disabled={isDeleting}
          className="ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Delete Task'}
        </button>
      </form>
    </div>
  )
}

/**
 * Combined Example - List with inline mutations
 */
export function AdvancedDataFetchingExample() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg">
      <h1 className="text-3xl font-bold mb-8">Advanced Data Fetching Examples</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <AdvancedQueryExample />
        </div>

        <div className="bg-white rounded-lg shadow">
          {selectedTaskId ? (
            <AdvancedMutationExample taskId={selectedTaskId} />
          ) : (
            <div className="p-4">
              <h3 className="text-lg font-bold mb-4">Select a task to edit</h3>
              <p className="text-gray-600">
                Click on a task from the list on the left to edit or delete it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
