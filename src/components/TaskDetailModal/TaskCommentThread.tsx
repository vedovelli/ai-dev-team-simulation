import { useQuery } from '@tanstack/react-query'
import { TaskCommentForm } from './TaskCommentForm'
import type { TaskComment } from '../../types/task'

interface TaskCommentThreadProps {
  taskId: string
}

const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`

  return date.toLocaleDateString()
}

// Simple markdown rendering for comments
const renderMarkdown = (text: string): React.ReactNode => {
  // Bold
  let result = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Italic
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Code
  result = result.replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs">$1</code>')
  // Line breaks
  result = result.replace(/\n/g, '<br />')

  return <div dangerouslySetInnerHTML={{ __html: result }} />
}

export function TaskCommentThread({ taskId }: TaskCommentThreadProps) {
  const { data: comments, isLoading, error } = useQuery<TaskComment[]>({
    queryKey: ['tasks', taskId, 'comments'],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/comments`)
      if (!response.ok) throw new Error('Failed to fetch comments')
      return response.json()
    },
    staleTime: 15000, // 15 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Failed to load comments</p>
      </div>
    )
  }

  // Sort by oldest first (chronological order)
  const sortedComments = comments
    ? [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : []

  return (
    <div className="space-y-6">
      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : sortedComments.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-500">No comments yet</p>
          </div>
        ) : (
          sortedComments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">
                      {comment.author.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{comment.author}</p>
                    <p className="text-xs text-gray-500">{getRelativeTime(comment.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-700 leading-relaxed break-words">
                {renderMarkdown(comment.content)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Form */}
      <div className="border-t pt-6">
        <TaskCommentForm taskId={taskId} />
      </div>
    </div>
  )
}
