import { useForm } from '@tanstack/react-form'
import { useEffect, useState } from 'react'
import type { Task, UpdateTaskInput } from '../../types/task'
import { useUpdateTask } from '../../hooks/useUpdateTask'

interface TaskEditFormProps {
  task: Task
  onClose: () => void
  onUnsavedChangesChange: (hasChanges: boolean) => void
}

interface TaskFormData {
  title: string
  description: string
  priority: string
  status: string
  assignee: string
  deadline: string
  estimatedHours: number | ''
}

const PRIORITIES = ['none', 'low', 'normal', 'high', 'urgent']
const STATUSES = ['backlog', 'in-progress', 'in-review', 'done']

export function TaskEditForm({
  task,
  onClose,
  onUnsavedChangesChange,
}: TaskEditFormProps) {
  const [apiError, setApiError] = useState<string | null>(null)
  const updateMutation = useUpdateTask()

  const form = useForm<TaskFormData>({
    defaultValues: {
      title: task.title || '',
      description: '', // Will be added to Task type later
      priority: task.priority || 'normal',
      status: task.status || 'backlog',
      assignee: task.assignee || '',
      deadline: task.deadline || '',
      estimatedHours: task.estimatedHours || '',
    },
    onSubmit: async ({ value }) => {
      setApiError(null)

      try {
        // Validate that deadline is not in the past
        if (value.deadline) {
          const deadlineDate = new Date(value.deadline)
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          if (deadlineDate < today) {
            setApiError('Deadline cannot be in the past')
            return
          }
        }

        const updateData: UpdateTaskInput = {
          title: value.title,
          priority: value.priority as any,
          status: value.status as any,
          assignee: value.assignee,
          deadline: value.deadline || undefined,
          estimatedHours: value.estimatedHours ? Number(value.estimatedHours) : undefined,
        }

        await updateMutation.mutateAsync({
          id: task.id,
          data: updateData,
        })

        onUnsavedChangesChange(false)
        onClose()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to update task'
        setApiError(message)
      }
    },
  })

  // Track unsaved changes
  useEffect(() => {
    const subscription = form.subscribe(
      ({ values }) => {
        const hasChanges =
          values.title !== task.title ||
          values.priority !== task.priority ||
          values.status !== task.status ||
          values.assignee !== task.assignee ||
          values.deadline !== (task.deadline || '') ||
          values.estimatedHours !== (task.estimatedHours || '')

        onUnsavedChangesChange(hasChanges)
      },
      { selector: (state) => state.values }
    )

    return () => subscription.unsubscribe()
  }, [task, form, onUnsavedChangesChange])

  const handleCancel = () => {
    if (form.getFieldValue('title') !== task.title ||
        form.getFieldValue('priority') !== task.priority ||
        form.getFieldValue('status') !== task.status ||
        form.getFieldValue('assignee') !== task.assignee ||
        form.getFieldValue('deadline') !== (task.deadline || '') ||
        form.getFieldValue('estimatedHours') !== (task.estimatedHours || '')) {
      if (confirm('You have unsaved changes. Discard them?')) {
        form.reset()
        onClose()
      }
    } else {
      onClose()
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      {/* API Error */}
      {apiError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      {/* Title Field */}
      <form.Field
        name="title"
        validators={{
          onBlur: ({ value }) => {
            if (!value || value.trim() === '') {
              return 'Title is required'
            }
            if (value.length < 3) {
              return 'Title must be at least 3 characters'
            }
            return undefined
          },
        }}
      >
        {(field) => (
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              disabled={updateMutation.isPending}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-red-600 mt-1">
                {field.state.meta.errors.join(', ')}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Priority Field */}
      <form.Field
        name="priority"
        validators={{
          onBlur: ({ value }) => {
            if (!PRIORITIES.includes(value)) {
              return 'Invalid priority'
            }
            return undefined
          },
        }}
      >
        {(field) => (
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              disabled={updateMutation.isPending}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p} className="capitalize">
                  {p}
                </option>
              ))}
            </select>
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-red-600 mt-1">
                {field.state.meta.errors.join(', ')}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Status Field */}
      <form.Field
        name="status"
        validators={{
          onBlur: ({ value }) => {
            if (!STATUSES.includes(value)) {
              return 'Invalid status'
            }
            return undefined
          },
        }}
      >
        {(field) => (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              disabled={updateMutation.isPending}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-red-600 mt-1">
                {field.state.meta.errors.join(', ')}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Assignee Field */}
      <form.Field
        name="assignee"
        validators={{
          onBlur: ({ value }) => {
            if (!value || value.trim() === '') {
              return 'Assignee is required'
            }
            return undefined
          },
        }}
      >
        {(field) => (
          <div>
            <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
              Assignee *
            </label>
            <input
              id="assignee"
              type="text"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              disabled={updateMutation.isPending}
              placeholder="e.g., Alice"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-red-600 mt-1">
                {field.state.meta.errors.join(', ')}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Deadline Field */}
      <form.Field
        name="deadline"
        validators={{
          onBlur: ({ value }) => {
            if (value) {
              const deadlineDate = new Date(value)
              const today = new Date()
              today.setHours(0, 0, 0, 0)

              if (deadlineDate < today) {
                return 'Deadline cannot be in the past'
              }
            }
            return undefined
          },
        }}
      >
        {(field) => (
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
              Deadline
            </label>
            <input
              id="deadline"
              type="date"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              disabled={updateMutation.isPending}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-red-600 mt-1">
                {field.state.meta.errors.join(', ')}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Estimated Hours Field */}
      <form.Field
        name="estimatedHours"
        validators={{
          onBlur: ({ value }) => {
            if (value !== '' && value !== null) {
              const num = Number(value)
              if (isNaN(num) || num < 0) {
                return 'Must be a positive number'
              }
              if (num > 999) {
                return 'Estimated hours must not exceed 999'
              }
            }
            return undefined
          },
        }}
      >
        {(field) => (
          <div>
            <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Hours
            </label>
            <input
              id="estimatedHours"
              type="number"
              min="0"
              max="999"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={field.handleBlur}
              disabled={updateMutation.isPending}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-red-600 mt-1">
                {field.state.meta.errors.join(', ')}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-6 border-t">
        <button
          type="button"
          onClick={handleCancel}
          disabled={updateMutation.isPending}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
