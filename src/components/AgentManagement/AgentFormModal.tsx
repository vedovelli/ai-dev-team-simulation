import { useForm } from '@tanstack/react-form'
import { useState, useEffect } from 'react'
import type { AgentManagement } from '../../types/agent'
import { useCreateAgent } from '../../hooks/mutations/useCreateAgent'
import { useUpdateAgent } from '../../hooks/mutations/useUpdateAgent'
import { useToastApi } from '../../hooks/useToastApi'

interface AgentFormData {
  name: string
  capabilities: string[]
  rateLimit?: number
}

interface AgentFormModalProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  agent?: AgentManagement
  existingAgents?: AgentManagement[]
  onClose: () => void
}

const AVAILABLE_CAPABILITIES = [
  'code-review',
  'refactoring',
  'architecture',
  'feature-implementation',
  'testing',
  'debugging',
  'api-design',
  'database-optimization',
  'infrastructure',
  'frontend-development',
  'ui-optimization',
  'accessibility',
  'documentation',
  'planning',
  'team-coordination',
  'devops',
  'ci-cd',
  'monitoring',
  'bug-fixes',
  'performance-tuning',
  'automation',
  'qa-strategy',
]

export function AgentFormModal({
  isOpen,
  mode,
  agent,
  existingAgents = [],
  onClose,
}: AgentFormModalProps) {
  const { showSuccess, showError } = useToastApi()
  const createMutation = useCreateAgent()
  const updateMutation = useUpdateAgent(agent?.id || '')
  const [apiError, setApiError] = useState<string | null>(null)

  const form = useForm<AgentFormData>({
    defaultValues: {
      name: agent?.name || '',
      capabilities: agent?.capabilities || [],
      rateLimit: agent?.rateLimit?.requestsPerMinute,
    },
    onSubmit: async ({ value }) => {
      setApiError(null)

      try {
        const input = {
          name: value.name,
          capabilities: value.capabilities,
          ...(value.rateLimit && {
            rateLimit: { requestsPerMinute: value.rateLimit },
          }),
        }

        if (mode === 'create') {
          await createMutation.mutateAsync(input)
          showSuccess('Agent created successfully')
        } else {
          await updateMutation.mutateAsync(input)
          showSuccess('Agent updated successfully')
        }

        handleClose()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'An error occurred'
        setApiError(message)
        showError(message)
      }
    },
  })

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

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const nameValue = form.getFieldValue('name')
  const capabilitiesValue = form.getFieldValue('capabilities')

  // Check if name is unique (excluding current agent)
  const isDuplicateName =
    mode === 'create'
      ? existingAgents.some(
          (a) => a.name.toLowerCase() === nameValue.toLowerCase()
        )
      : existingAgents.some(
          (a) =>
            a.id !== agent?.id &&
            a.name.toLowerCase() === nameValue.toLowerCase()
        )

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-form-title"
    >
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <h2
            id="agent-form-title"
            className="text-xl font-semibold mb-1"
          >
            {mode === 'create' ? 'Create Agent' : 'Edit Agent'}
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            {mode === 'create'
              ? 'Add a new agent to your system'
              : `Update agent "${agent?.name}"`}
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
                    return 'Agent name is required'
                  }
                  if (value.length < 2) {
                    return 'Name must be at least 2 characters'
                  }
                  if (value.length > 50) {
                    return 'Name must not exceed 50 characters'
                  }
                  if (isDuplicateName) {
                    return 'An agent with this name already exists'
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <div>
                  <label
                    htmlFor="agent-name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Agent Name *
                  </label>
                  <input
                    id="agent-name"
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.setValue(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="e.g., Alice"
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

            {/* Capabilities Field */}
            <form.Field
              name="capabilities"
              validators={{
                onBlur: ({ value }) => {
                  if (!value || value.length === 0) {
                    return 'At least one capability is required'
                  }
                  if (value.length > 10) {
                    return 'Maximum 10 capabilities allowed'
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capabilities *
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                    <div className="grid grid-cols-2 gap-3">
                      {AVAILABLE_CAPABILITIES.map((capability) => (
                        <label
                          key={capability}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={field.state.value.includes(capability)}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...field.state.value, capability]
                                : field.state.value.filter(
                                    (c) => c !== capability
                                  )
                              field.setValue(updated)
                            }}
                            onBlur={field.handleBlur}
                            disabled={isSubmitting}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">
                            {capability}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
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
                  {capabilitiesValue.length > 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      Selected: {capabilitiesValue.length}/10
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Rate Limit Field */}
            <form.Field
              name="rateLimit"
              validators={{
                onBlur: ({ value }) => {
                  if (value !== undefined && value !== null) {
                    if (value <= 0) {
                      return 'Rate limit must be a positive number'
                    }
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <div>
                  <label
                    htmlFor="rate-limit"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Rate Limit (requests/min) (optional)
                  </label>
                  <input
                    id="rate-limit"
                    type="number"
                    value={field.state.value ?? ''}
                    onChange={(e) =>
                      field.setValue(
                        e.target.value ? parseInt(e.target.value, 10) : undefined
                      )
                    }
                    onBlur={field.handleBlur}
                    placeholder="e.g., 100"
                    min="1"
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
                disabled={isSubmitting || isDuplicateName || capabilitiesValue.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting
                  ? mode === 'create'
                    ? 'Creating...'
                    : 'Updating...'
                  : mode === 'create'
                    ? 'Create Agent'
                    : 'Update Agent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
