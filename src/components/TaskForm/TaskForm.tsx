import { useForm, FieldInfo } from '@tanstack/react-form'
import { useEffect, useMemo } from 'react'
import type { Task, TaskFormData, TaskStatus, TaskPriority } from '../../types/task'
import { useTaskForm } from '../../hooks/useTaskForm'
import { validations } from './validations'
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

  const form = useForm<TaskFormData>({
    defaultValues: {
      name: task?.name || '',
      description: task?.description || '',
      status: task?.status || 'todo',
      priority: task?.priority || 'medium',
      dueDate: task?.dueDate || '',
      tags: task?.tags || [],
    },
    onSubmit: async ({ value }) => {
      await handleSubmit(value)
    },
  })

  const statusValue = form.getFieldValue('status')
  const priorityValue = form.getFieldValue('priority')
  const tagsValue = form.getFieldValue('tags')

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
    const currentTags = form.getFieldValue('tags')
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
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
            onChange: validations.name.validate,
          }}
          children={(field) => (
            <FieldWrapper field={field} label="Task Name">
              <input
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter task name"
                maxLength={100}
                className="task-form-input"
                disabled={isSubmitting}
              />
              <div className="char-count">
                {field.state.value.length}/100
              </div>
            </FieldWrapper>
          )}
        />

        {/* Description Field */}
        <form.Field
          name="description"
          validators={{
            onChange: validations.description.validate,
          }}
          children={(field) => (
            <FieldWrapper field={field} label="Description (Optional)">
              <textarea
                value={field.state.value || ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter task description"
                maxLength={500}
                rows={4}
                className="task-form-textarea"
                disabled={isSubmitting}
              />
              <div className="char-count">
                {(field.state.value || '').length}/500
              </div>
            </FieldWrapper>
          )}
        />

        {/* Status Field */}
        <form.Field
          name="status"
          validators={{
            onChange: validations.status.validate,
          }}
          children={(field) => (
            <FieldWrapper field={field} label="Status">
              <select
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value as TaskStatus)}
                className="task-form-select"
                disabled={isSubmitting}
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace('-', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </FieldWrapper>
          )}
        />

        {/* Priority Field */}
        <form.Field
          name="priority"
          validators={{
            onChange: validations.priority.validate,
          }}
          children={(field) => (
            <FieldWrapper field={field} label="Priority">
              <select
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value as TaskPriority)}
                className="task-form-select"
                disabled={isSubmitting}
              >
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </FieldWrapper>
          )}
        />

        {/* Conditional Due Date Field */}
        {shouldShowDueDate && (
          <form.Field
            name="dueDate"
            validators={{
              onChange: (value) =>
                validations.dueDate.validate(value, priorityValue),
            }}
            children={(field) => (
              <FieldWrapper field={field} label="Due Date">
                <input
                  type="date"
                  value={field.state.value || ''}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="task-form-input"
                  disabled={isSubmitting}
                />
              </FieldWrapper>
            )}
          />
        )}

        {/* Conditional Tags Field */}
        {shouldShowTags && (
          <form.Field
            name="tags"
            validators={{
              onChange: (value) =>
                validations.tags.validate(value, statusValue),
            }}
            children={(field) => (
              <FieldWrapper field={field} label="Tags">
                <div className="tags-container">
                  {AVAILABLE_TAGS.map((tag) => (
                    <label key={tag} className="tag-checkbox">
                      <input
                        type="checkbox"
                        checked={field.state.value.includes(tag)}
                        onChange={() => handleTagToggle(tag)}
                        disabled={isSubmitting}
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              </FieldWrapper>
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

interface FieldWrapperProps {
  field: FieldInfo<any, any, any, any>
  label: string
  children: React.ReactNode
}

function FieldWrapper({ field, label, children }: FieldWrapperProps) {
  const error = field.state.meta.errors[0]
  const isDirty = field.state.meta.isDirty
  const isTouched = field.state.meta.isTouched

  return (
    <div className="form-field">
      <label htmlFor={field.name} className="form-label">
        {label}
      </label>
      {children}
      {error && isDirty && isTouched && (
        <div className="form-error">{error}</div>
      )}
    </div>
  )
}
