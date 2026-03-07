import { useForm } from '@tanstack/react-form'
import { useState, useEffect } from 'react'
import type { Sprint } from '../../types/sprint'

interface SprintFormData {
  name: string
  goals: string
  status: 'planning' | 'active' | 'completed'
  estimatedPoints: number
  startDate?: string
  endDate?: string
}

interface SprintFormDialogProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  sprint?: Sprint
  onClose: () => void
  onSubmit: (data: SprintFormData) => Promise<void>
}

export function SprintFormDialog({
  isOpen,
  mode,
  sprint,
  onClose,
  onSubmit,
}: SprintFormDialogProps) {
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SprintFormData>({
    defaultValues: {
      name: sprint?.name || '',
      goals: sprint?.goals || '',
      status: sprint?.status || 'planning',
      estimatedPoints: sprint?.estimatedPoints || 0,
      startDate: sprint?.startDate || '',
      endDate: sprint?.endDate || '',
    },
    onSubmit: async ({ value }) => {
      setApiError(null)
      setIsSubmitting(true)

      try {
        await onSubmit(value)
        handleClose()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to save sprint'
        setApiError(message)
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  // Reset form when sprint changes
  useEffect(() => {
    if (sprint) {
      form.reset()
    }
  }, [sprint])

  const handleClose = () => {
    form.reset()
    setApiError(null)
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  if (!isOpen) return null

  const nameValue = form.getFieldValue('name')
  const statusValue = form.getFieldValue('status')

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sprint-form-title"
    >
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <h2
            id="sprint-form-title"
            className="text-xl font-semibold mb-1"
          >
            {mode === 'create' ? 'Create Sprint' : 'Edit Sprint'}
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            {mode === 'create'
              ? 'Start a new sprint'
              : `Update "${sprint?.name}"`}
          </p>

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

            {/* Name Field */}
            <form.Field
              name="name"
              validators={{
                onBlur: ({ value }) => {
                  if (!value || value.trim() === '') {
                    return 'Sprint name is required'
                  }
                  if (value.length < 2) {
                    return 'Name must be at least 2 characters'
                  }
                  if (value.length > 100) {
                    return 'Name must not exceed 100 characters'
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <div>
                  <label
                    htmlFor="sprint-name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Sprint Name *
                  </label>
                  <input
                    id="sprint-name"
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.setValue(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="e.g., Sprint 1"
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                      field.state.meta.errors && field.state.meta.errors.length
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {field.state.meta.errors && field.state.meta.errors.length
                    ? field.state.meta.errors.map((error) => (
                        <p
                          key={error}
                          className="mt-1 text-sm text-red-600"
                        >
                          {error}
                        </p>
                      ))
                    : null}
                </div>
              )}
            </form.Field>

            {/* Goals Field */}
            <form.Field
              name="goals"
              validators={{
                onBlur: ({ value }) => {
                  if (value && value.length > 500) {
                    return 'Goals must not exceed 500 characters'
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <div>
                  <label
                    htmlFor="sprint-goals"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Goals
                  </label>
                  <textarea
                    id="sprint-goals"
                    value={field.state.value}
                    onChange={(e) => field.setValue(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="What are the sprint goals?"
                    disabled={isSubmitting}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                      field.state.meta.errors && field.state.meta.errors.length
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {field.state.meta.errors && field.state.meta.errors.length
                    ? field.state.meta.errors.map((error) => (
                        <p
                          key={error}
                          className="mt-1 text-sm text-red-600"
                        >
                          {error}
                        </p>
                      ))
                    : null}
                  {field.state.value && (
                    <p className="mt-1 text-xs text-gray-500">
                      {field.state.value.length}/500
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
                  if (!value) {
                    return 'Status is required'
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <div>
                  <label
                    htmlFor="sprint-status"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Status *
                  </label>
                  <select
                    id="sprint-status"
                    value={field.state.value}
                    onChange={(e) =>
                      field.setValue(
                        e.target.value as 'planning' | 'active' | 'completed'
                      )
                    }
                    onBlur={field.handleBlur}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                      field.state.meta.errors && field.state.meta.errors.length
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select status</option>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                  {field.state.meta.errors && field.state.meta.errors.length
                    ? field.state.meta.errors.map((error) => (
                        <p
                          key={error}
                          className="mt-1 text-sm text-red-600"
                        >
                          {error}
                        </p>
                      ))
                    : null}
                </div>
              )}
            </form.Field>

            {/* Estimated Points Field */}
            <form.Field
              name="estimatedPoints"
              validators={{
                onBlur: ({ value }) => {
                  if (value < 0) {
                    return 'Estimated points must be a positive number'
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <div>
                  <label
                    htmlFor="sprint-points"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Estimated Points
                  </label>
                  <input
                    id="sprint-points"
                    type="number"
                    value={field.state.value}
                    onChange={(e) =>
                      field.setValue(parseInt(e.target.value, 10) || 0)
                    }
                    onBlur={field.handleBlur}
                    placeholder="0"
                    min="0"
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                      field.state.meta.errors && field.state.meta.errors.length
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {field.state.meta.errors && field.state.meta.errors.length
                    ? field.state.meta.errors.map((error) => (
                        <p
                          key={error}
                          className="mt-1 text-sm text-red-600"
                        >
                          {error}
                        </p>
                      ))
                    : null}
                </div>
              )}
            </form.Field>

            {/* Start Date Field */}
            <form.Field
              name="startDate"
              validators={{
                onBlur: ({ value }) => {
                  if (value && statusValue === 'active' && !value) {
                    return 'Start date is required for active sprints'
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <div>
                  <label
                    htmlFor="sprint-start-date"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Start Date
                  </label>
                  <input
                    id="sprint-start-date"
                    type="date"
                    value={field.state.value}
                    onChange={(e) => field.setValue(e.target.value)}
                    onBlur={field.handleBlur}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                      field.state.meta.errors && field.state.meta.errors.length
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {field.state.meta.errors && field.state.meta.errors.length
                    ? field.state.meta.errors.map((error) => (
                        <p
                          key={error}
                          className="mt-1 text-sm text-red-600"
                        >
                          {error}
                        </p>
                      ))
                    : null}
                </div>
              )}
            </form.Field>

            {/* End Date Field */}
            <form.Field
              name="endDate"
              validators={{
                onBlur: ({ value }) => {
                  if (value && statusValue === 'active' && !value) {
                    return 'End date is required for active sprints'
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <div>
                  <label
                    htmlFor="sprint-end-date"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    End Date
                  </label>
                  <input
                    id="sprint-end-date"
                    type="date"
                    value={field.state.value}
                    onChange={(e) => field.setValue(e.target.value)}
                    onBlur={field.handleBlur}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                      field.state.meta.errors && field.state.meta.errors.length
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {field.state.meta.errors && field.state.meta.errors.length
                    ? field.state.meta.errors.map((error) => (
                        <p
                          key={error}
                          className="mt-1 text-sm text-red-600"
                        >
                          {error}
                        </p>
                      ))
                    : null}
                </div>
              )}
            </form.Field>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !nameValue || !statusValue}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting
                  ? mode === 'create'
                    ? 'Creating...'
                    : 'Updating...'
                  : mode === 'create'
                    ? 'Create Sprint'
                    : 'Update Sprint'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
