import { useForm } from '@tanstack/react-form'
import { useState, useEffect } from 'react'
import { useCreateTemplate } from '../hooks/useCreateTemplate'
import { useUpdateTemplate } from '../hooks/useUpdateTemplate'
import type { TaskTemplate } from '../types/template'
import type { TaskStatus, TaskPriority } from '../types/task'

interface TemplateFormData {
  name: string
  description: string
  title: string
  taskDescription: string
  status: TaskStatus
  priority: TaskPriority
  estimatedHours: number
  labels: string
}

interface TemplateFormDialogProps {
  isOpen: boolean
  onClose: () => void
  initialTemplate?: TaskTemplate | null
}

export function TemplateFormDialog({
  isOpen,
  onClose,
  initialTemplate,
}: TemplateFormDialogProps) {
  const [apiError, setApiError] = useState<string | null>(null)
  const { mutate: createTemplate, isPending: isCreating } = useCreateTemplate()
  const { mutate: updateTemplate, isPending: isUpdating } = useUpdateTemplate()

  const form = useForm<TemplateFormData>({
    defaultValues: {
      name: initialTemplate?.name || '',
      description: initialTemplate?.description || '',
      title: initialTemplate?.defaultFields?.title || '',
      taskDescription: initialTemplate?.defaultFields?.description || '',
      status: initialTemplate?.defaultFields?.status || 'backlog',
      priority: initialTemplate?.defaultFields?.priority || 'medium',
      estimatedHours: initialTemplate?.defaultFields?.estimatedHours || 0,
      labels: initialTemplate?.defaultFields?.labels?.join(', ') || '',
    },
    onSubmit: async ({ value }) => {
      setApiError(null)

      // Validate at least one field is set
      const hasDefaultField =
        value.title ||
        value.taskDescription ||
        value.estimatedHours > 0 ||
        value.labels

      if (!hasDefaultField) {
        setApiError('Please set at least one default field')
        return
      }

      try {
        const templateData = {
          name: value.name,
          description: value.description,
          defaultFields: {
            title: value.title || undefined,
            description: value.taskDescription || undefined,
            status: value.status,
            priority: value.priority,
            estimatedHours: value.estimatedHours || undefined,
            labels: value.labels
              ? value.labels.split(',').map((l) => l.trim())
              : undefined,
          },
        }

        if (initialTemplate) {
          updateTemplate(
            { id: initialTemplate.id, data: templateData },
            {
              onSuccess: () => {
                form.reset()
                onClose()
              },
              onError: (error) => {
                setApiError(error.message)
              },
            }
          )
        } else {
          createTemplate(templateData, {
            onSuccess: () => {
              form.reset()
              onClose()
            },
            onError: (error) => {
              setApiError(error.message)
            },
          })
        }
      } catch (error) {
        setApiError(
          error instanceof Error ? error.message : 'Failed to save template'
        )
      }
    },
  })

  useEffect(() => {
    if (isOpen) {
      form.reset()
    }
  }, [isOpen])

  if (!isOpen) return null

  const isPending = isCreating || isUpdating

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {initialTemplate ? 'Edit Template' : 'Create New Template'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="p-6 space-y-6"
        >
          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {apiError}
            </div>
          )}

          {/* Template Name */}
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.trim() === '') {
                  return 'Template name is required'
                }
                if (value.length > 100) {
                  return 'Template name must be less than 100 characters'
                }
              },
            }}
          >
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="e.g., Bug Fix, Feature Development"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {field.state.meta.errors && (
                  <p className="mt-1 text-sm text-red-600">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Template Description */}
          <form.Field name="description">
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Description
                </label>
                <textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Describe what this template is for"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </form.Field>

          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Default Fields
            </h3>

            {/* Task Title */}
            <form.Field name="title">
              {(field) => (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="e.g., Fix: [Brief description]"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </form.Field>

            {/* Task Description */}
            <form.Field name="taskDescription">
              {(field) => (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Description
                  </label>
                  <textarea
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Default description for tasks created from this template"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Status */}
              <form.Field name="status">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Status
                    </label>
                    <select
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(e.target.value as TaskStatus)
                      }
                      onBlur={field.handleBlur}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="backlog">Backlog</option>
                      <option value="in-progress">In Progress</option>
                      <option value="in-review">In Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                )}
              </form.Field>

              {/* Priority */}
              <form.Field name="priority">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Priority
                    </label>
                    <select
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(e.target.value as TaskPriority)
                      }
                      onBlur={field.handleBlur}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                )}
              </form.Field>
            </div>

            {/* Estimated Hours */}
            <form.Field name="estimatedHours">
              {(field) => (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value ? parseFloat(e.target.value) : 0
                      )
                    }
                    onBlur={field.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </form.Field>

            {/* Labels */}
            <form.Field name="labels">
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Labels (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="e.g., frontend, bug, urgent"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </form.Field>
          </div>

          {/* Actions */}
          <div className="border-t pt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {initialTemplate ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
