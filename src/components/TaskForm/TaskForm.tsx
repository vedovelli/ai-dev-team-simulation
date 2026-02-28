import { useForm } from '@tanstack/react-form'
import { useEffect, useMemo } from 'react'
import type { Task, TaskFormData, TaskStatus, TaskPriority } from '../../types/task'
import { useTaskForm } from '../../hooks/useTaskForm'
import './TaskForm.css'

const TASK_STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done']
const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']
const AVAILABLE_TAGS = [
  'feature',
  'bug',
  'documentation',
  'refactor',
  'performance',
  'testing',
]

interface TaskFormProps {
  task?: Task | null
  onSuccess?: (task: Task) => void
  onError?: (error: Error) => void
}

export function TaskForm({ task, onSuccess, onError }: TaskFormProps) {
  const { handleSubmit, isSubmitting, serverError, setServerError, isEditing } =
    useTaskForm({ initialTask: task, onSuccess, onError })

  const form = useForm({
    defaultValues: {
      name: task?.name ?? '',
      description: task?.description ?? '',
      status: task?.status ?? 'todo',
      priority: task?.priority ?? 'medium',
      dueDate: task?.dueDate ?? '',
      tags: task?.tags ?? [],
    },
    onSubmit: async ({ value }: { value: any }) => {
      await handleSubmit(value as TaskFormData)
    },
  } as any)

  const statusValue = (form.getFieldValue('status') ?? 'todo') as TaskStatus
  const priorityValue = (form.getFieldValue('priority') ?? 'medium') as TaskPriority

  // Determine which fields should be visible
  const shouldShowDueDate = useMemo(
    () => priorityValue === 'high',
    [priorityValue],
  )

  const shouldShowTags = useMemo(() => statusValue !== 'todo', [statusValue])

  // Reset server error when form values change
  useEffect(() => {
    if (serverError) {
      setServerError(null)
    }
  }, [form.state.values, serverError, setServerError])

  const handleTagToggle = (tag: string) => {
    const currentTags = (form.getFieldValue('tags') ?? []) as string[]
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t: string) => t !== tag)
      : [...currentTags, tag]
    form.setFieldValue('tags', newTags)
  }

  return (
    <div className="task-form-container">
      <h1 className="task-form-title">
        {isEditing ? 'Edit Task' : 'Create New Task'}
      </h1>

      {serverError && (
        <div className="task-form-error-alert">{serverError}</div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="task-form"
      >
        {/* Name Field */}
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }: { value: any }) => {
              if (!value) {
                return 'Task name is required'
              }
              if ((value as string).length < 3) {
                return 'Task name must be at least 3 characters'
              }
              if ((value as string).length > 100) {
                return 'Task name must not exceed 100 characters'
              }
              return undefined
            },
          }}
          children={(field: any) => (
            <div className="form-field">
              <label htmlFor="name" className="form-label">
                Task Name
              </label>
              <input
                id="name"
                type="text"
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter task name"
                maxLength={100}
                className="task-form-input"
                disabled={isSubmitting}
              />
              <div className="char-count">
                {((field.state.value ?? '') as string).length}/100
              </div>
              {field.state.meta.errors &&
                field.state.meta.isDirty &&
                field.state.meta.isTouched && (
                  <div className="form-error">
                    {String(field.state.meta.errors[0])}
                  </div>
                )}
            </div>
          )}
        />

        {/* Description Field */}
        <form.Field
          name="description"
          validators={{
            onChange: ({ value }: { value: any }) => {
              if (value && (value as string).length > 500) {
                return 'Description must not exceed 500 characters'
              }
              return undefined
            },
          }}
          children={(field: any) => (
            <div className="form-field">
              <label htmlFor="description" className="form-label">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={(field.state.value ?? '') as string}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter task description"
                maxLength={500}
                rows={4}
                className="task-form-textarea"
                disabled={isSubmitting}
              />
              <div className="char-count">
                {((field.state.value ?? '') as string).length}/500
              </div>
              {field.state.meta.errors &&
                field.state.meta.isDirty &&
                field.state.meta.isTouched && (
                  <div className="form-error">
                    {String(field.state.meta.errors[0])}
                  </div>
                )}
            </div>
          )}
        />

        {/* Status Field */}
        <form.Field
          name="status"
          validators={{
            onChange: ({ value }: { value: any }) => {
              if (!value) {
                return 'Status is required'
              }
              if (!['todo', 'in-progress', 'done'].includes(value as string)) {
                return 'Invalid status'
              }
              return undefined
            },
          }}
          children={(field: any) => (
            <div className="form-field">
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                value={field.state.value ?? 'todo'}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="task-form-select"
                disabled={isSubmitting}
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace('-', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
              {field.state.meta.errors &&
                field.state.meta.isDirty &&
                field.state.meta.isTouched && (
                  <div className="form-error">
                    {String(field.state.meta.errors[0])}
                  </div>
                )}
            </div>
          )}
        />

        {/* Priority Field */}
        <form.Field
          name="priority"
          validators={{
            onChange: ({ value }: { value: any }) => {
              if (!value) {
                return 'Priority is required'
              }
              if (!['low', 'medium', 'high'].includes(value as string)) {
                return 'Invalid priority'
              }
              return undefined
            },
          }}
          children={(field: any) => (
            <div className="form-field">
              <label htmlFor="priority" className="form-label">
                Priority
              </label>
              <select
                id="priority"
                value={field.state.value ?? 'medium'}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="task-form-select"
                disabled={isSubmitting}
              >
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
              {field.state.meta.errors &&
                field.state.meta.isDirty &&
                field.state.meta.isTouched && (
                  <div className="form-error">
                    {String(field.state.meta.errors[0])}
                  </div>
                )}
            </div>
          )}
        />

        {/* Conditional Due Date Field */}
        {shouldShowDueDate && (
          <form.Field
            name="dueDate"
            validators={{
              onChange: ({ value }: { value: any }) => {
                if (priorityValue === 'high' && !value) {
                  return 'Due date is required for high priority tasks'
                }
                if (value) {
                  const date = new Date(value as string)
                  if (isNaN(date.getTime())) {
                    return 'Invalid date format'
                  }
                }
                return undefined
              },
            }}
            children={(field: any) => (
              <div className="form-field">
                <label htmlFor="dueDate" className="form-label">
                  Due Date
                </label>
                <input
                  id="dueDate"
                  type="date"
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="task-form-input"
                  disabled={isSubmitting}
                />
                {field.state.meta.errors &&
                  field.state.meta.isDirty &&
                  field.state.meta.isTouched && (
                    <div className="form-error">
                      {String(field.state.meta.errors[0])}
                    </div>
                  )}
              </div>
            )}
          />
        )}

        {/* Conditional Tags Field */}
        {shouldShowTags && (
          <form.Field
            name="tags"
            validators={{
              onChange: ({ value }: { value: any }) => {
                const tagsArray = (value ?? []) as string[]
                if (statusValue !== 'todo' && tagsArray.length === 0) {
                  return 'At least one tag is required for non-todo tasks'
                }
                return undefined
              },
            }}
            children={(field: any) => (
              <div className="form-field">
                <label className="form-label">Tags</label>
                <div className="tags-container">
                  {AVAILABLE_TAGS.map((tag) => (
                    <label key={tag} className="tag-checkbox">
                      <input
                        type="checkbox"
                        checked={
                          ((field.state.value ?? []) as string[]).includes(tag)
                        }
                        onChange={() => handleTagToggle(tag)}
                        disabled={isSubmitting}
                      />
                      {tag}
                    </label>
                  ))}
                </div>
                {field.state.meta.errors &&
                  field.state.meta.isDirty &&
                  field.state.meta.isTouched && (
                    <div className="form-error">
                      {String(field.state.meta.errors[0])}
                    </div>
                  )}
              </div>
            )}
          />
        )}

        {/* Submit Button */}
        <div className="task-form-actions">
          <button
            type="submit"
            disabled={isSubmitting || !form.state.isFormValid}
            className="task-form-button task-form-button-primary"
          >
            {isSubmitting
              ? 'Saving...'
              : isEditing
                ? 'Update Task'
                : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  )
}
