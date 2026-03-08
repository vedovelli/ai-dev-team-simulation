import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTaskExecution } from '../../../hooks/mutations/useTaskExecution'
import { useTaskComments } from '../../../hooks/mutations/useTaskComments'
import type { Task } from '../../../types/task'

interface TaskDetailPanelProps {
  taskId: string
}

interface TaskComment {
  id: string
  author: string
  content: string
  createdAt: string
}

export function TaskDetailPanel({ taskId }: TaskDetailPanelProps) {
  const [commentText, setCommentText] = useState('')
  const [selectedAction, setSelectedAction] = useState<
    'start' | 'pause' | 'complete' | 'blocked' | null
  >(null)

  const queryClient = useQueryClient()
  const { executeTask, isPending: isExecuting } = useTaskExecution()
  const { addComment, isPending: isCommentPending } = useTaskComments()

  // Fetch task details
  const {
    data: task,
    isLoading: isTaskLoading,
    error: taskError,
  } = useQuery<Task>({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch task')
      }
      return response.json()
    },
  })

  // Fetch comments
  const {
    data: comments = [],
    isLoading: isCommentsLoading,
  } = useQuery<TaskComment[]>({
    queryKey: ['task', taskId, 'comments'],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/comments`)
      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }
      return response.json()
    },
  })

  const handleStatusAction = async (action: typeof selectedAction) => {
    if (!action) return

    try {
      await executeTask({
        taskId,
        action,
      })
      setSelectedAction(null)
    } catch (error) {
      console.error('Failed to execute task action:', error)
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) return

    try {
      await addComment({
        taskId,
        content: commentText,
      })
      setCommentText('')
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const getStatusColor = (status: Task['status']) => {
    const colorMap = {
      'in-progress': 'bg-blue-100 text-blue-800',
      backlog: 'bg-gray-100 text-gray-800',
      'in-review': 'bg-yellow-100 text-yellow-800',
      done: 'bg-green-100 text-green-800',
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: Task['priority']) => {
    const colorMap = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-red-100 text-red-800',
    }
    return colorMap[priority] || 'bg-gray-100 text-gray-800'
  }

  if (isTaskLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-500">Loading task details...</p>
      </div>
    )
  }

  if (taskError || !task) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">
          Error loading task: {taskError?.message || 'Task not found'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-white rounded-lg shadow-sm p-6">
      {/* Task Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
        <p className="mt-2 text-sm text-gray-600">ID: {task.id}</p>
      </div>

      {/* Status and Priority */}
      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
            {task.status}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </div>
        </div>
      </div>

      {/* Task Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assignee
          </label>
          <p className="text-sm text-gray-600">{task.assignee}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Team
          </label>
          <p className="text-sm text-gray-600">{task.team}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Story Points
          </label>
          <p className="text-sm text-gray-600">{task.storyPoints}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sprint
          </label>
          <p className="text-sm text-gray-600">{task.sprint}</p>
        </div>
      </div>

      {/* Status Transition Form */}
      <div className="border-t pt-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Execution Controls
        </h2>

        {isExecuting && (
          <div className="mb-4 rounded-lg bg-blue-50 p-3">
            <p className="text-sm text-blue-800">Updating task...</p>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <select
              value={selectedAction || ''}
              onChange={(e) =>
                setSelectedAction(
                  (e.target.value as typeof selectedAction) || null
                )
              }
              disabled={isExecuting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select an action...</option>
              {task.status === 'backlog' && (
                <option value="start">Start Task</option>
              )}
              {task.status === 'in-progress' && (
                <>
                  <option value="pause">Pause Task</option>
                  <option value="complete">Complete Task</option>
                </>
              )}
              {task.status !== 'done' && (
                <option value="blocked">Mark as Blocked</option>
              )}
            </select>
          </div>

          <button
            onClick={() => handleStatusAction(selectedAction)}
            disabled={!selectedAction || isExecuting}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExecuting ? 'Executing...' : 'Execute'}
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="border-t pt-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Notes & Comments
        </h2>

        {/* Comment Input */}
        <div className="mb-4 space-y-2">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment or note..."
            disabled={isCommentPending}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            rows={3}
          />
          <button
            onClick={handleAddComment}
            disabled={!commentText.trim() || isCommentPending}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCommentPending ? 'Adding...' : 'Add Comment'}
          </button>
        </div>

        {/* Comments List */}
        {isCommentsLoading ? (
          <p className="text-sm text-gray-500">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {comment.author}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
