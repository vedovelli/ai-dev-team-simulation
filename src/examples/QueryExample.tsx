import { useQuery } from '@tanstack/react-query'
import type { Task } from '../types/task'

/**
 * Simple example demonstrating TanStack Query usage
 *
 * This example shows:
 * - Setting up a basic query hook
 * - Handling loading and error states
 * - Rendering fetched data
 *
 * @example
 * const { data: tasks, isLoading, error } = useQuery({
 *   queryKey: ['tasks'],
 *   queryFn: () => fetch('/api/tasks').then(r => r.json())
 * })
 */
export function QueryExample() {
  const { data: tasks, isLoading, isError, error } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await fetch('/api/tasks')
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      const result = await response.json()
      return result.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Loading tasks...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">Error loading tasks</p>
        <p className="text-sm">{error?.message}</p>
      </div>
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded">
        <p>No tasks found</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Tasks</h2>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id} className="p-3 border rounded bg-white hover:bg-gray-50">
            <div className="font-semibold">{task.title}</div>
            <div className="text-sm text-gray-600">
              Status: {task.status} | Priority: {task.priority}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Example with query parameters
 *
 * Shows how to pass filters to the query and how changing
 * them triggers refetches.
 */
export function QueryExampleWithFilters() {
  const [status, setStatus] = React.useState<string>('')

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', { status }],  // Query key includes filters
    queryFn: async () => {
      const url = new URL('/api/tasks', window.location.origin)
      if (status) {
        url.searchParams.set('status', status)
      }

      const response = await fetch(url.toString())
      const result = await response.json()
      return result.data
    },
  })

  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="mr-2 font-medium">Filter by Status:</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All</option>
          <option value="backlog">Backlog</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      {isLoading && <p>Loading...</p>}

      <div className="space-y-2">
        {tasks?.map((task) => (
          <div key={task.id} className="p-2 border rounded">
            {task.title}
          </div>
        ))}
      </div>
    </div>
  )
}

import React from 'react'
