/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TaskForm } from '../components/TaskForm/TaskForm'
import type { Task } from '../types/task'

export const Route = createFileRoute('/tasks')({
  component: TasksPage,
})

function TasksPage() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await fetch('/api/tasks')
      return response.json() as Promise<Task[]>
    },
  })

  const selectedTask = tasks.find((t) => t.id === selectedTaskId)

  const handleSuccess = () => {
    setShowForm(false)
    setSelectedTaskId(null)
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tasks</h1>
          <p className="text-gray-600">Manage your tasks with TanStack Form</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            {showForm || selectedTaskId ? (
              <div>
                <button
                  onClick={() => {
                    setShowForm(false)
                    setSelectedTaskId(null)
                  }}
                  className="mb-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  ← Back to List
                </button>
                <TaskForm
                  task={selectedTask}
                  onSuccess={handleSuccess}
                  onError={(error) => {
                    console.error('Form error:', error)
                  }}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + New Task
              </button>
            )}
          </div>

          {/* Tasks List Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Tasks ({tasks.length})
                </h2>
              </div>

              {tasks.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-gray-500">No tasks yet. Create one to get started!</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {task.name}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                            >
                              {task.status.replace('-', ' ').toUpperCase()}
                            </span>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority.charAt(0).toUpperCase() +
                                task.priority.slice(1)}
                            </span>

                            {task.dueDate && (
                              <span className="text-xs text-gray-500">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {task.tags.length > 0 && (
                            <div className="mt-2 flex items-center gap-1 flex-wrap">
                              {task.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTaskId(task.id)
                            setShowForm(true)
                          }}
                          className="ml-4 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded"
                        >
                          Edit
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    todo: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  }
  return colors[priority] || 'bg-gray-100 text-gray-800'
}
