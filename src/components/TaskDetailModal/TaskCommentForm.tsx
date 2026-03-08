import { useState } from 'react'
import { useAddTaskComment } from '../../hooks/useAddTaskComment'

interface TaskCommentFormProps {
  taskId: string
}

export function TaskCommentForm({ taskId }: TaskCommentFormProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const addCommentMutation = useAddTaskComment()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!content.trim()) {
      setError('Comment cannot be empty')
      return
    }

    try {
      await addCommentMutation.mutateAsync({ taskId, content })
      setContent('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add comment'
      setError(message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          Add a comment
        </label>
        <textarea
          id="comment"
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            setError(null)
          }}
          disabled={addCommentMutation.isPending}
          placeholder="Share your thoughts... (Markdown supported)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100"
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-1">Markdown formatting is supported</p>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setContent('')}
          disabled={addCommentMutation.isPending}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={addCommentMutation.isPending || !content.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  )
}
