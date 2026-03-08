import { useForm } from '@tanstack/react-form'
import { useState, useEffect } from 'react'
import type { AgentSettings } from '../lib/validation'
import { agentSettingsSchema } from '../lib/validation'
import { useUpdateAgentSettings } from '../hooks/mutations/useUpdateAgentSettings'
import { useQuery } from '@tanstack/react-query'

interface AgentSettingsModalProps {
  isOpen: boolean
  agentId: string
  onClose: () => void
}

export function AgentSettingsModal({
  isOpen,
  agentId,
  onClose,
}: AgentSettingsModalProps) {
  const [apiError, setApiError] = useState<string | null>(null)
  const updateMutation = useUpdateAgentSettings(agentId)

  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['agents', agentId, 'settings'],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/settings`)
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }
      return response.json() as Promise<AgentSettings>
    },
    enabled: isOpen && !!agentId,
  })

  const form = useForm<AgentSettings>({
    defaultValues: currentSettings || {
      agentId,
      taskPriorityFilter: 'all',
      autoAssignmentEnabled: false,
      maxConcurrentTasks: 5,
      notificationPreferences: {
        onTaskAssigned: true,
        onTaskCompleted: true,
        dailyDigest: false,
      },
    },
    onSubmit: async ({ value }) => {
      setApiError(null)

      try {
        await updateMutation.mutateAsync(value)
        handleClose()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to save settings'
        setApiError(message)
      }
    },
  })

  // Reset form when settings change - FIX #1: Added form to dependency array
  useEffect(() => {
    if (currentSettings) {
      form.reset()
    }
  }, [currentSettings, form])

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

  const isSubmitting = updateMutation.isPending

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-form-title"
    >
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <h2
            id="settings-form-title"
            className="text-xl font-semibold mb-1"
          >
            Agent Settings
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Configure behavior and preferences for this agent
          </p>

          {isLoading ? (
            <div className="p-4 text-center text-gray-600">Loading settings...</div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
              }}
              className="space-y-5"
            >
              {/* API Error */}
              {apiError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{apiError}</p>
                </div>
              )}

              {/* Task Priority Filter */}
              <form.Field
                name="taskPriorityFilter"
                validators={{
                  onBlur: ({ value }) => {
                    if (!value || !['all', 'high', 'medium', 'low'].includes(value)) {
                      return 'Valid priority filter is required'
                    }
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <div>
                    <label
                      htmlFor="priority-filter"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Task Priority Filter
                    </label>
                    <select
                      id="priority-filter"
                      value={field.state.value}
                      onChange={(e) => field.setValue(e.target.value)}
                      onBlur={field.handleBlur}
                      disabled={isSubmitting}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                        field.state.meta.errors && field.state.meta.errors.length
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    >
                      <option value="all">All Priorities</option>
                      <option value="high">High Priority Only</option>
                      <option value="medium">Medium & High</option>
                      <option value="low">All Priorities</option>
                    </select>
                    {field.state.meta.errors && field.state.meta.errors.length
                      ? field.state.meta.errors.map((error) => (
                          <p key={error} className="mt-1 text-sm text-red-600">
                            {error}
                          </p>
                        ))
                      : null}
                  </div>
                )}
              </form.Field>

              {/* Auto-Assignment */}
              <form.Field
                name="autoAssignmentEnabled"
                validators={{
                  onBlur: ({ value }) => {
                    if (typeof value !== 'boolean') {
                      return 'Auto-assignment must be enabled or disabled'
                    }
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.state.value}
                        onChange={(e) => field.setValue(e.target.checked)}
                        onBlur={field.handleBlur}
                        disabled={isSubmitting}
                        className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Enable Auto-Assignment
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Automatically assign compatible tasks to this agent
                    </p>
                    {field.state.meta.errors && field.state.meta.errors.length
                      ? field.state.meta.errors.map((error) => (
                          <p key={error} className="mt-1 text-sm text-red-600">
                            {error}
                          </p>
                        ))
                      : null}
                  </div>
                )}
              </form.Field>

              {/* Max Concurrent Tasks */}
              <form.Field
                name="maxConcurrentTasks"
                validators={{
                  onBlur: ({ value, formApi }) => {
                    if (typeof value !== 'number' || value < 1 || value > 10) {
                      return 'Must be between 1 and 10'
                    }
                    // FIX #2: Get current form value instead of snapshot
                    const autoAssignmentValue = formApi.getFieldValue('autoAssignmentEnabled')
                    if (autoAssignmentValue && !value) {
                      return 'Required when auto-assignment is enabled'
                    }
                    return undefined
                  },
                }}
              >
                {(field) => {
                  // FIX #2: Get current form value for reactive display
                  const autoAssignmentValue = form.getFieldValue('autoAssignmentEnabled')
                  return (
                    <div>
                      <label
                        htmlFor="max-tasks"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Max Concurrent Tasks
                        {autoAssignmentValue && <span className="text-red-500"> *</span>}
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          id="max-tasks"
                          type="number"
                          min="1"
                          max="10"
                          value={field.state.value}
                          onChange={(e) => field.setValue(parseInt(e.target.value))}
                          onBlur={field.handleBlur}
                          disabled={isSubmitting}
                          className={`flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                            field.state.meta.errors && field.state.meta.errors.length
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }`}
                        />
                        <span className="text-sm text-gray-600">tasks</span>
                      </div>
                      {field.state.meta.errors && field.state.meta.errors.length
                        ? field.state.meta.errors.map((error) => (
                            <p key={error} className="mt-1 text-sm text-red-600">
                              {error}
                            </p>
                          ))
                        : null}
                    </div>
                  )
                }}
              </form.Field>

              {/* Notification Preferences */}
              <fieldset className="space-y-3 p-4 bg-gray-50 rounded-md border border-gray-200">
                <legend className="text-sm font-medium text-gray-700">
                  Notification Preferences
                </legend>

                {/* On Task Assigned */}
                <form.Field
                  name="notificationPreferences"
                  validators={{
                    onBlur: ({ value }) => {
                      // FIX #3: Add constraint validation for at least one notification enabled
                      const hasAnyEnabled =
                        value.onTaskAssigned || value.onTaskCompleted || value.dailyDigest
                      if (!hasAnyEnabled) {
                        return 'At least one notification preference must be enabled'
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => {
                    const prefs = field.state.value
                    return (
                      <>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prefs.onTaskAssigned}
                            onChange={(e) => {
                              field.setValue({
                                ...prefs,
                                onTaskAssigned: e.target.checked,
                              })
                            }}
                            onBlur={field.handleBlur}
                            disabled={isSubmitting}
                            className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            Notify on task assigned
                          </span>
                        </label>

                        {/* On Task Completed */}
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prefs.onTaskCompleted}
                            onChange={(e) => {
                              field.setValue({
                                ...prefs,
                                onTaskCompleted: e.target.checked,
                              })
                            }}
                            onBlur={field.handleBlur}
                            disabled={isSubmitting}
                            className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            Notify on task completed
                          </span>
                        </label>

                        {/* Daily Digest */}
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prefs.dailyDigest}
                            onChange={(e) => {
                              field.setValue({
                                ...prefs,
                                dailyDigest: e.target.checked,
                              })
                            }}
                            onBlur={field.handleBlur}
                            disabled={isSubmitting}
                            className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            Daily digest of activity
                          </span>
                        </label>

                        {field.state.meta.errors && field.state.meta.errors.length
                          ? field.state.meta.errors.map((error) => (
                              <p key={error} className="mt-2 text-sm text-red-600">
                                {error}
                              </p>
                            ))
                          : null}
                      </>
                    )
                  }}
                </form.Field>
              </fieldset>

              {/* Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
